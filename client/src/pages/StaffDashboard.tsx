import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WasteLevelsTab } from "./staff/tabs/WasteLevelsTab";
import { MapTab } from "./staff/tabs/StaffMapTab";
import { StaffTab } from "./staff/tabs/StaffTabb";
import { SettingsTab } from "./admin/tabs/SettingsTab";
import { StaffSidebar } from "./staff/nav/StaffSidebar";
import { StaffDashboardHeader } from "./staff/nav/StaffDashboardHeader";
import { StaffActivityTab } from "./staff/tabs/StaffActivityTab";
import { ScheduleCollectionTabs } from "./staff/tabs/SchedulecollectionTabs";
import Feedback from "./staff/tabs/FeedbackView";
import { BinHistory } from "./staff/pages/BinHistory";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";


const StaffDashboard = () => {
  const [activePage, setActivePage] = useState("overview");
  
  // Enable real-time notifications
  useRealtimeNotifications();

  const renderContent = () => {
    switch (activePage) {
      case "overview":
        return <WasteLevelsTab />;
      case "map":
      return <MapTab />;
      case "schedule":
      return <ScheduleCollectionTabs/>
      case "activity":
        return <StaffActivityTab />;
      case "bin-history":
        return <BinHistory />;
      case "staff":
        return <StaffTab/>;
      case "feedback":
        return <Feedback />;
      case "settings":
        return <SettingsTab />;
      default:
        return <WasteLevelsTab />;
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
