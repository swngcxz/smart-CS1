import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/nav/AdminSidebar";
import { DashboardHeader } from "./admin/nav/DashboardHeader";
import { AnalyticsTab } from "./admin/tabs/AnalyticsTab";
import { DashboardOverview } from "./admin/tabs/DashboardOverview";
import { WasteLevelsTab } from "./admin/tabs/WasteLevelsTab";
import { MapTab } from "./admin/tabs/MapTab";
import { StaffTab } from "./admin/tabs/StaffTab";
import { ActivityTab } from "./admin/tabs/ActivityTab";
import { HistoryLogsTab } from "./admin/tabs/HistoryLogsTab";
import { SettingsTab } from "./admin/tabs/SettingsTab";
import { StaffSidebar } from "./staff/nav/StaffSidebar";
import { StaffDashboardHeader } from "./staff/nav/StaffDashboardHeader";
import { StaffActivityTab } from "./staff/tabs/StaffActivityTab";
import { ScheduleCollectionTabs } from "./admin/tabs/ScheduleCollectionTabs";
import Feedback from "./admin/tabs/FeedbackView";


const StaffDashboard = () => {
  const [activePage, setActivePage] = useState("overview");

  const renderContent = () => {
    switch (activePage) {
      case "overview":
        return <DashboardOverview />;
      case "waste-levels":
        return <WasteLevelsTab />;
      case "map":
      return <MapTab />;
      case "schedule":
      return <ScheduleCollectionTabs/>;
      case "activity":
        return <StaffActivityTab />;
      case "staff":
        return <StaffTab />;
      case "feedback":
        return <Feedback />;
      case "settings":
        return <SettingsTab />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <StaffSidebar currentTab={activePage} onTabChange={setActivePage} />
        <div className="flex-1 flex flex-col">
          <StaffDashboardHeader />
          <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffDashboard;
