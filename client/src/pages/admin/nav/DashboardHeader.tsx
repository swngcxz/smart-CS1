import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { NotificationPopover } from "@/components/modal/NotificationPopover";

export function DashboardHeader() {
  return (
    <header className="bg-background dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationPopover />
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
      </div>
    </header>
  );
}
