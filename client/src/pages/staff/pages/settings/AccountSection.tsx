"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Pencil, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const AccountSection = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    accountType: "",
    memberSince: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  });

  const { toast } = useToast();

  const handleEdit = (field: string) => setIsEditing(field);

  const handleSave = (field: string, value: string) => {
    setAccountInfo((prev) => ({ ...prev, [field]: value }));
    setIsEditing(null);
    toast({ title: "Updated successfully", description: `${field} has been updated.` });
  };

  useEffect(() => {
    if (!user) return;
    setAccountInfo({
      username: user.fullName || user.email?.split('@')[0] || '',
      accountType: user.role || 'staff',
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    });
  }, [user]);

  const EditableField = ({ field, value, label }: { field: string; value: string; label: string }) => {
    const [tempValue, setTempValue] = useState(value);
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        {isEditing === field ? (
          <div className="flex items-center gap-2">
            <Input value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={() => handleSave(field, tempValue)} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <span className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md">
              {value}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(field)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
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
    </div>
  );
};


