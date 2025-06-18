import React, { useState } from "react";
import zxcvbn from "zxcvbn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Key, Shield, Smartphone, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const SecuritySection = () => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
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

    toast({
      title: "Password updated",
      description: "Your password has been successfully changed.",
    });

    setPasswords({ current: "", new: "", confirm: "" });
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    toast({
      title: enabled ? "Two-factor authentication enabled" : "Two-factor authentication disabled",
      description: enabled
        ? "Your account is now more secure with 2FA."
        : "Two-factor authentication has been disabled.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Password Section */}
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

            {/* Password Strength Meter */}
            {passwords.new && (
              <div className="w-full">
                <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-emerald-600"][
                        getPasswordStrength().score
                      ]
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
              className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md transition-colors"
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Auth */}
      <Card className="shadow-sm dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Enable 2FA</Label>
                {twoFactorEnabled && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-white">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={handleTwoFactorToggle} />
          </div>

          {twoFactorEnabled && (
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">2FA is enabled</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account is protected with two-factor authentication using your authenticator app.
              </p>
              <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Recovery Codes
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Recovery Codes</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Here are your backup codes. Keep them safe:</p>
                    <ul className="grid grid-cols-2 gap-2 font-mono text-xs mt-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <li key={i} className="bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {Math.random().toString(36).substring(2, 10).toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="shadow-sm dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-800 dark:text-slate-100">Active Sessions</CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="text-green-700 hover:text-white hover:bg-green-700"
            title="Logout from All Devices"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-medium text-sm">Current Session</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Chrome on Windows • San Francisco, CA</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Last active: Now</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-white">
              Current
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <p className="font-medium text-sm">Mobile App</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">iOS App • San Francisco, CA</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Last active: 2 hours ago</p>
            </div>
            <Button variant="outline" size="sm">
              Revoke
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
