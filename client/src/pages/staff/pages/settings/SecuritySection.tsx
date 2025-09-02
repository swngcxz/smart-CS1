import React, { useState } from "react";
import zxcvbn from "zxcvbn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export const SecuritySection = () => {
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
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
      return toast({ title: "Password mismatch", description: "New password and confirmation don't match.", variant: "destructive" });
    }
    if (!isPasswordStrong()) {
      return toast({ title: "Weak password", description: "Password must be strong.", variant: "destructive" });
    }
    try {
      await api.post('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.new });
      toast({ title: 'Password updated', description: 'Your password has been changed.' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      toast({ title: 'Failed to change password', description: err?.response?.data?.error || 'Error', variant: 'destructive' });
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
            </div>
          )}

          <Button type="submit" className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors">
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};


