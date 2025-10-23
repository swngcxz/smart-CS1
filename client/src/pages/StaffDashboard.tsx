import { useState, useMemo, useCallback } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WasteLevelsTab } from "./staff/tabs/WasteLevelsTab";
import { MapTab } from "./staff/tabs/StaffMapTab";
import { StaffTab } from "./staff/tabs/StaffTabb";
import { SettingsTab } from "../pages/admin/tabs/SettingsTab";
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

  // Create all tab components once and keep them mounted
  const tabComponents = useMemo(
    () => ({
      overview: <WasteLevelsTab />,
      map: <MapTab />,
      schedule: <ScheduleCollectionTabs />,
      activity: <StaffActivityTab />,
      "bin-history": <BinHistory />,
      staff: <StaffTab />,
      feedback: <Feedback />,
      settings: <SettingsTab />,
    }),
    []
  );

  const renderContent = useCallback(() => {
    // Render all tabs but only show the active one
    return (
      <div className="relative">
        {Object.entries(tabComponents).map(([tabName, component]) => (
          <div
            key={tabName}
            className={`${tabName === activePage ? "block" : "hidden"}`}
            style={{
              display: tabName === activePage ? "block" : "none",
              position: tabName === activePage ? "relative" : "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: tabName === activePage ? 1 : -1,
            }}
            data-tab-active={tabName === activePage}
          >
            {component}
          </div>
        ))}
      </div>
    );
  }, [activePage, tabComponents]);

  const handleTabChange = useCallback((tab: string) => {
    console.log("🔄 Tab changing to:", tab, "at:", new Date().toLocaleTimeString());
    console.log("📊 All tabs are kept mounted - no re-initialization needed");
    setActivePage(tab);

    // Dispatch custom event for components to listen to
    window.dispatchEvent(
      new CustomEvent("tabChanged", {
        detail: { activeTab: tab, timestamp: Date.now() },
      })
    );
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <StaffSidebar currentTab={activePage} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col">
          <StaffDashboardHeader />
          <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StaffDashboard;
