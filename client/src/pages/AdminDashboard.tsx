import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/nav/AdminSidebar";
import { DashboardHeader } from "./admin/nav/DashboardHeader";
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { DashboardOverview } from "./auth/DashboardOverview";
import { WasteLevelsTab } from "./admin/tabs/WasteLevelsTab";
import { MapTab } from "./admin/tabs/MapTab";
import { StaffTab } from "./admin/tabs/StaffTab";
import { ActivityTab } from "./admin/tabs/ActivityTab";
import { HistoryLogsTab } from "./admin/tabs/HistoryLogsTab";
import { SettingsTab } from "./admin/tabs/SettingsTab";
const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("overview");

const renderContent = () => {
  switch (activePage) {
    case "overview":
      return <DashboardOverview />;
    case "waste-levels":
      return <WasteLevelsTab />;
    case "map":
      return <MapTab />;
    case "analytics":
      return <AnalyticsTab />;
    case "staff":
      return <StaffTab />;
    case "activity":
      return <ActivityTab />;
    case "history":
      return <HistoryLogsTab />;
    case "settings":
      return <SettingsTab />;
    default:
      return <DashboardOverview />;
  }
};


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar currentTab={activePage} onTabChange={setActivePage} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
