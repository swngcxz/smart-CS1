import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import api from "@/lib/api";

export const PreferencesSection = () => {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
  });

  useEffect(() => {
    // Optionally prefill from user-specific fields if stored
  }, [user]);

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    try {
      // Persist preference snapshot on profile (optional keys)
      await api.patch('/auth/me', { preferences: { ...prefs, [key]: value } });
      toast({ title: 'Preferences updated' });
    } catch (err: any) {
      toast({ title: 'Failed to update preferences', description: err?.response?.data?.error, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Email Notifications</Label>
            <p className="text-xs text-slate-500">Receive updates via email</p>
          </div>
          <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => handleToggle('emailNotifications', v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Push Notifications</Label>
            <p className="text-xs text-slate-500">Receive alerts on your device</p>
          </div>
          <Switch checked={prefs.pushNotifications} onCheckedChange={(v) => handleToggle('pushNotifications', v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Dark Mode</Label>
            <p className="text-xs text-slate-500">Use dark theme in the app</p>
          </div>
          <Switch checked={prefs.darkMode} onCheckedChange={(v) => handleToggle('darkMode', v)} />
        </div>
      </CardContent>
    </Card>
  );
};


