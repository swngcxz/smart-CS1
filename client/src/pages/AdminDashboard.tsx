import { useState, useMemo, useCallback } from "react";
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
import { BinHistory } from "./admin/pages/BinHistory";
import { PerformanceTab } from "./admin/tabs/PerformanceTab";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const AdminDashboard = () => {
  const [activePage, setActivePage] = useState("overview");
  
  // Enable real-time notifications
  useRealtimeNotifications();

  // Create all tab components once and keep them mounted
  const tabComponents = useMemo(() => ({
    overview: <AnalyticsTab />,
    map: <MapTab />,
    staff: <StaffTab />,
    performance: <PerformanceTab />,
    schedule: <ScheduleCollectionTabs />,
    activity: <ActivityTab />,
    history: <HistoryLogsTab />,
    "bin-history": <BinHistory />,
    settings: <SettingsTab />,
  }), []);

  const renderContent = useCallback(() => {
    // Render all tabs but only show the active one
    return (
      <div className="relative">
        {Object.entries(tabComponents).map(([tabName, component]) => (
          <div
            key={tabName}
            className={`${tabName === activePage ? 'block' : 'hidden'}`}
            style={{ 
              display: tabName === activePage ? 'block' : 'none',
              position: tabName === activePage ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: tabName === activePage ? 1 : -1
            }}
          >
            {component}
          </div>
        ))}
      </div>
    );
  }, [activePage, tabComponents]);

  const handleTabChange = useCallback((tab: string) => {
    setActivePage(tab);
    // Dispatch custom event for components to listen to (if needed)
    window.dispatchEvent(new CustomEvent('tabChanged', { 
      detail: { activeTab: tab, scope: 'admin', timestamp: Date.now() }
    }));
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <AdminSidebar currentTab={activePage} onTabChange={handleTabChange} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
