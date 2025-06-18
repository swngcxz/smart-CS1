import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

export const PreferencesSection = () => {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
      marketing: true,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      fontSize: [16],
      screenReader: false,
    },
    general: {
      language: "en",
      theme: "light",
      autoSave: true,
    },
  });

  const { toast } = useToast();

  const handleNotificationChange = (key: string, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    toast({
      title: "Notification settings updated",
      description: `${key} notifications ${value ? "enabled" : "disabled"}.`,
    });
  };

  const handleAccessibilityChange = (key: string, value: boolean | number[]) => {
    setPreferences((prev) => ({
      ...prev,
      accessibility: { ...prev.accessibility, [key]: value },
    }));
    toast({
      title: "Accessibility settings updated",
      description: `${key} preference has been updated.`,
    });
  };

  const handleGeneralChange = (key: string, value: string | boolean) => {
    setPreferences((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
    toast({
      title: "General settings updated",
      description: `${key} preference has been updated.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-sm text-slate-600">Receive notifications via email</p>
              </div>
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(value) => handleNotificationChange("email", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-sm text-slate-600">Receive push notifications in your browser</p>
              </div>
              <Switch
                checked={preferences.notifications.push}
                onCheckedChange={(value) => handleNotificationChange("push", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-sm text-slate-600">Receive important updates via SMS</p>
              </div>
              <Switch
                checked={preferences.notifications.sms}
                onCheckedChange={(value) => handleNotificationChange("sms", value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">High Contrast Mode</Label>
                <p className="text-sm text-slate-600">Increase contrast for better visibility</p>
              </div>
              <Switch
                checked={preferences.accessibility.highContrast}
                onCheckedChange={(value) => handleAccessibilityChange("highContrast", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Reduced Motion</Label>
                <p className="text-sm text-slate-600">Minimize animations and transitions</p>
              </div>
              <Switch
                checked={preferences.accessibility.reducedMotion}
                onCheckedChange={(value) => handleAccessibilityChange("reducedMotion", value)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Font Size</Label>
              <div className="px-3">
                <Slider
                  value={preferences.accessibility.fontSize}
                  onValueChange={(value) => handleAccessibilityChange("fontSize", value)}
                  max={24}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Small (12px)</span>
                  <span>Current: {preferences.accessibility.fontSize[0]}px</span>
                  <span>Large (24px)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Screen Reader Support</Label>
                <p className="text-sm text-slate-600">Enhanced support for screen readers</p>
              </div>
              <Switch
                checked={preferences.accessibility.screenReader}
                onCheckedChange={(value) => handleAccessibilityChange("screenReader", value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>General Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language</Label>
              <Select
                value={preferences.general.language}
                onValueChange={(value) => handleGeneralChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Theme</Label>
              <Select
                value={theme}
                onValueChange={(value) => {
                  setTheme(value);
                  toast({
                    title: "Theme updated",
                    description: `Theme has been set to ${value}`,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-save</Label>
              <p className="text-sm text-slate-600">Automatically save changes as you type</p>
            </div>
            <Switch
              checked={preferences.general.autoSave}
              onCheckedChange={(value) => handleGeneralChange("autoSave", value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
