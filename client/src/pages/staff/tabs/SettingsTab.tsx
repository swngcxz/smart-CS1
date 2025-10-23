import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "../pages/settings/ProfileSection";
import { AccountSection } from "../pages/settings/AccountSection";
import { PreferencesSection } from "../pages/settings/PreferencesSection";
import { SecuritySection } from "../pages/settings/SecuritySection";
import { Card } from "@/components/ui/card";
import { User, Settings } from "lucide-react";

export const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="mb-8">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Settings</h4>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700 rounded-md">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Settings className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
