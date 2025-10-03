import React, { useState } from "react";
import zxcvbn from "zxcvbn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export const SecuritySection = () => {
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = () => zxcvbn(passwords.new);
  const isPasswordStrong = () => {
    const { score } = getPasswordStrength();
    const hasUpper = /[A-Z]/.test(passwords.new);
    const hasNumber = /\d/.test(passwords.new);
    const hasSymbol = /[^A-Za-z0-9]/.test(passwords.new);
    return passwords.new.length >= 8 && score >= 3 && hasUpper && hasNumber && hasSymbol;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      return toast({
        title: "Password mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
    }

    if (!isPasswordStrong()) {
      return toast({
        title: "Weak password",
        description: "Password must be at least 8 characters long and include uppercase letters, numbers, and symbols.",
        variant: "destructive",
      });
    }

    if (!passwords.current.trim()) {
      return toast({
        title: "Current password required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
    }

    try {
      setIsChangingPassword(true);
      
      const response = await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error('Password change error:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to change password';
      
      toast({
        title: "Password change failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  return (
    <Card className="shadow-sm dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Key className="w-5 h-5" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {["current", "new", "confirm"].map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={`${field}-password`}>
                {field === "current" ? "Current Password" : field === "new" ? "New Password" : "Confirm New Password"}
              </Label>
              <div className="relative">
                <Input
                  id={`${field}-password`}
                  type={showPasswords[field as keyof typeof showPasswords] ? "text" : "password"}
                  value={passwords[field as keyof typeof passwords]}
                  onChange={(e) => handlePasswordChange(field, e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility(field)}
                >
                  {showPasswords[field as keyof typeof showPasswords] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          {passwords.new && (
            <div className="w-full">
              <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-emerald-600"][getPasswordStrength().score]
                  }`}
                  style={{ width: `${(getPasswordStrength().score + 1) * 20}%` }}
                />
              </div>
              <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                {["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][getPasswordStrength().score]}
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isChangingPassword}
            className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};


