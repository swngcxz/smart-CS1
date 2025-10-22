import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "../pages/settings/ProfileSection";
import { AccountSection } from "../pages/settings/AccountSection";
import { PreferencesSection } from "../pages/settings/PreferencesSection";
import { SecuritySection } from "../pages/settings/SecuritySection";
import { AdminSettingsSkeleton } from "@/components/skeletons/AdminSettingsSkeleton";
import { User, Settings, Shield, Bell } from "lucide-react";

export const SettingsTab = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading for admin settings
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Show skeleton while loading
  if (loading) {
    return <AdminSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="mb-5">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="w-full flex h-auto p-0 bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none">
            <TabsTrigger
              value="profile"
              className="flex-1 px-6 py-3 text-xs font-medium text-center transition-colors duration-200 relative border-b-2 border-transparent data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=active]:text-green-400 dark:data-[state=active]:border-green-400 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex-1 px-6 py-3 text-xs font-medium text-center transition-colors duration-200 relative border-b-2 border-transparent data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=active]:text-green-400 dark:data-[state=active]:border-green-400 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex-1 px-6 py-3 text-xs font-medium text-center transition-colors duration-200 relative border-b-2 border-transparent data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=active]:text-green-400 dark:data-[state=active]:border-green-400 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
            >
              <Bell className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex-1 px-6 py-3 text-xs font-medium text-center transition-colors duration-200 relative border-b-2 border-transparent data-[state=active]:text-green-600 data-[state=active]:border-green-600 data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=active]:text-green-400 dark:data-[state=active]:border-green-400 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="account">
            <AccountSection />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSection />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
