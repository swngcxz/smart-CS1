import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Bell, Eye, Globe, Settings } from "lucide-react";

export const PreferencesSection = () => {
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: false,
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
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Email Notifications</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Receive notifications via email</p>
            </div>
            <Switch
              checked={preferences.notifications.email}
              onCheckedChange={(value) => handleNotificationChange("email", value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Push Notifications</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Receive push notifications in your browser</p>
            </div>
            <Switch
              checked={preferences.notifications.push}
              onCheckedChange={(value) => handleNotificationChange("push", value)}
            />
          </div>
        </div>
      </div>

      {/* Accessibility */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Accessibility</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">High Contrast Mode</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Increase contrast for better visibility</p>
            </div>
            <Switch
              checked={preferences.accessibility.highContrast}
              onCheckedChange={(value) => handleAccessibilityChange("highContrast", value)}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reduced Motion</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Minimize animations and transitions</p>
            </div>
            <Switch
              checked={preferences.accessibility.reducedMotion}
              onCheckedChange={(value) => handleAccessibilityChange("reducedMotion", value)}
            />
          </div>

          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Font Size</Label>
              <div className="px-3">
                <Slider
                  value={preferences.accessibility.fontSize}
                  onValueChange={(value) => handleAccessibilityChange("fontSize", value)}
                  max={24}
                  min={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>Small (12px)</span>
                  <span className="font-medium">Current: {preferences.accessibility.fontSize[0]}px</span>
                  <span>Large (24px)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Screen Reader Support</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Enhanced support for screen readers</p>
            </div>
            <Switch
              checked={preferences.accessibility.screenReader}
              onCheckedChange={(value) => handleAccessibilityChange("screenReader", value)}
            />
          </div>
        </div>
      </div>

      {/* General Preferences */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">General Preferences</h2>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide">Language</Label>
              <Select
                value={preferences.general.language}
                onValueChange={(value) => handleGeneralChange("language", value)}
              >
                <SelectTrigger className="h-10 border-slate-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/20">
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

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide">Theme</Label>
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
                <SelectTrigger className="h-10 border-slate-300 dark:border-slate-600 focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/20">
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

          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Auto-save</Label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Automatically save changes as you type</p>
            </div>
            <Switch
              checked={preferences.general.autoSave}
              onCheckedChange={(value) => handleGeneralChange("autoSave", value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
