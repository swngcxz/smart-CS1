"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Save, Pencil, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import api from "@/lib/api";

export const AccountSection = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { user, refreshUser } = useCurrentUser();
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    accountType: "",
    memberSince: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  });
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const handleEdit = (field: string) => setIsEditing(field);

  const handleSave = async (field: string, value: string) => {
    try {
      setLoading(true);
      
      // Prepare the update data - map frontend field names to backend field names
      const fieldMapping: { [key: string]: string } = {
        username: 'fullName', // username maps to fullName in backend
        timezone: 'timezone'
      };
      
      const backendField = fieldMapping[field] || field;
      const updateData = { [backendField]: value };
      
      // Call the backend API to update the user profile
      const response = await api.patch('/auth/me', updateData);
      
      if (response.data.message) {
        // Update local state
        setAccountInfo((prev) => ({ ...prev, [field]: value }));
        setIsEditing(null);
        
        // Refresh user data from backend to get the latest information
        await refreshUser();
        
        toast({
          title: "Updated successfully",
          description: `${field} has been updated.`,
        });
      }
    } catch (error: any) {
      console.error('Error updating account info:', error);
      toast({
        title: "Update failed",
        description: error.response?.data?.error || 'Failed to update account info. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    setAccountInfo({
      username: user.fullName || user.email?.split('@')[0] || '',
      accountType: user.role || 'user',
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    });
  }, [user]);

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion requested",
      description: "Your request to delete your account has been received.",
      variant: "destructive",
    });
  };

  const handleDeactivateAccount = () => {
    toast({
      title: "Account deactivated",
      description: "Your account has been deactivated temporarily.",
    });
  };

  const EditableField = ({ field, value, label }: { field: string; value: string; label: string }) => {
    const [tempValue, setTempValue] = useState(value);
    
    // Update tempValue when the actual value changes
    useEffect(() => {
      setTempValue(value);
    }, [value]);
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {isEditing === field ? (
          <div className="flex items-center gap-2">
            <Input 
              value={tempValue} 
              onChange={(e) => setTempValue(e.target.value)} 
              className="flex-1"
              disabled={loading}
            />
            <Button 
              size="sm" 
              onClick={() => handleSave(field, tempValue)} 
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsEditing(null)}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md">
              {value || <span className="text-slate-400 italic">Not set</span>}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(field)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              disabled={loading}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField field="username" value={accountInfo.username} label="Username" />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Type</Label>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md">
                {accountInfo.accountType}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Member Since</Label>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md">
                {accountInfo.memberSince}
              </div>
            </div>
            <EditableField field="timezone" value={accountInfo.timezone} label="Timezone" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Security Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Deactivate Account</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Temporarily deactivate your account. You can reactivate at any time by logging back in.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                >
                  Deactivate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be logged out and your account will become inactive. You can reactivate later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivateAccount} className="bg-yellow-500 hover:bg-yellow-600">
                    Yes, deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Delete Account</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>This action is permanent and cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
