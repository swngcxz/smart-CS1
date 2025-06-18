import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/nav/AdminSidebar";
import { DashboardHeader } from "./admin/nav/DashboardHeader";
import { AnalyticsTab } from "./admin/pages/AnalyticsTab";
import { DashboardOverview } from "./admin/pages/DashboardOverview";
import { StaffTab } from "./admin/pages/StaffTab";
import { MapTab } from "./admin/pages/MapTab";
import { ActivityTab } from "./admin/pages/ActivityTab";
import { WasteLevelsTab } from "./admin/pages/WasteLevelsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const AdminDashboard = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-auto">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="waste-levels">Waste Levels</TabsTrigger>
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <DashboardOverview />
              </TabsContent>
              
              <TabsContent value="waste-levels">
                <WasteLevelsTab />
              </TabsContent>
              
              <TabsContent value="map">
                <MapTab />
              </TabsContent>
              
              <TabsContent value="analytics">
                <AnalyticsTab />
              </TabsContent>
              
              <TabsContent value="staff">
                <StaffTab />
              </TabsContent>
              
              <TabsContent value="activity">
                <ActivityTab />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;