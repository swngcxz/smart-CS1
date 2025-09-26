import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/nav/AdminSidebar";
import { DashboardHeader } from "./admin/nav/DashboardHeader";
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { DashboardOverview } from "./admin/tabs/DashboardOverview";
import { MapTab } from "./admin/tabs/MapTab";
import { StaffTab } from "./admin/tabs/StaffTab";
import { ActivityTab } from "./admin/tabs/ActivityTab";
import { HistoryLogsTab } from "./admin/tabs/HistoryLogsTab";
import { SettingsTab } from "./admin/tabs/SettingsTab";
import { ScheduleCollectionTabs } from "./admin/tabs/ScheduleCollectionTabs";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("overview");
  
  // Enable real-time notifications
  useRealtimeNotifications();

  const renderContent = () => {
    switch (activePage) {
      case "overview":
        return <AnalyticsTab />;
      case "map":
        return <MapTab />;
      case "staff":
        return <StaffTab />;
        case "schedule":
        return <ScheduleCollectionTabs />;
      case "activity":
        return <ActivityTab />;
      case "history":
        return <HistoryLogsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <AnalyticsTab />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <AdminSidebar currentTab={activePage} onTabChange={setActivePage} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
