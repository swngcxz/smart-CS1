
import { Home, BarChart3, Users, MapPin, Activity, Settings, Recycle, History } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "#", icon: Home },
  { title: "Waste Levels", url: "#", icon: Recycle },
  { title: "Map View", url: "#", icon: MapPin },
  { title: "Analytics", url: "#", icon: BarChart3 },
  { title: "Staff", url: "#", icon: Users },
  { title: "Activity", url: "#", icon: Activity },
  { title: "History", url: "#", icon: History },
  { title: "Settings", url: "#", icon: Settings },
];

export function AdminSidebar() {
  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Smart Waste</h2>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-green-50 hover:text-green-700">
                    <a href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-md">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500">admin@smartwaste.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}