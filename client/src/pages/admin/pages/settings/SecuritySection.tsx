import React, { useState } from "react";
import zxcvbn from "zxcvbn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Key, Shield, Smartphone, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import api from "@/lib/api";

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

      const response = await api.post("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      console.error("Password change error:", error);

      const errorMessage = error.response?.data?.error || error.message || "Failed to change password";

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
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
        </div>
        <div className="space-y-6">
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["current", "new", "confirm"].map((field) => (
                <div key={field} className="space-y-3">
                  <Label
                    htmlFor={`${field}-password`}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide"
                  >
                    {field === "current"
                      ? "Current Password"
                      : field === "new"
                      ? "New Password"
                      : "Confirm New Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id={`${field}-password`}
                      type={showPasswords[field as keyof typeof showPasswords] ? "text" : "password"}
                      value={passwords[field as keyof typeof passwords]}
                      onChange={(e) => handlePasswordChange(field, e.target.value)}
                      className="w-full h-10 px-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/20 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => togglePasswordVisibility(field)}
                    >
                      {showPasswords[field as keyof typeof showPasswords] ? (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Password Strength Meter */}
            {passwords.new && (
              <div className="w-full">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500", "bg-emerald-600"][
                        getPasswordStrength().score
                      ]
                    }`}
                    style={{ width: `${(getPasswordStrength().score + 1) * 20}%` }}
                  />
                </div>
                <p className="text-xs mt-2 text-slate-600 dark:text-slate-400 font-medium">
                  {["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][getPasswordStrength().score]}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-200 dark:hover:shadow-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Two-Factor Auth */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enable 2FA</Label>
                {twoFactorEnabled && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
                  >
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
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">2FA is enabled</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Your account is protected with two-factor authentication using your authenticator app.
              </p>
              <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/20"
                  >
                    View Recovery Codes
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Recovery Codes</DialogTitle>
                    <DialogDescription>
                      Save these backup codes in a secure location. You can use them to access your account if you lose
                      your authenticator device.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>Here are your backup codes. Keep them safe:</p>
                    <ul className="grid grid-cols-2 gap-2 font-mono text-xs mt-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <li key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {Math.random().toString(36).substring(2, 10).toUpperCase()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Sessions</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            title="Logout from All Devices"
          >
            <LogOut className="w-4 h-4 " />
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Current Session</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Chrome on Windows • San Francisco, CA</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Last active: Now</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
              Current
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Mobile App</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">iOS App • San Francisco, CA</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">Last active: 2 hours ago</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              Revoke
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
