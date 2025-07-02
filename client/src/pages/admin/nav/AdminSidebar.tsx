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
import { Calendar } from "lucide-react";

type AdminSidebarProps = {
  currentTab: string;
  onTabChange: (value: string) => void;
};

const menuItems = [
  { title: "Dashboard", tab: "overview", icon: Home },
  { title: "Waste Levels", tab: "waste-levels", icon: Recycle },
  { title: "Map View", tab: "map", icon: MapPin },
  { title: "Analytics", tab: "analytics", icon: BarChart3 },
  { title: "Schedule", tab: "schedule", icon: Calendar },
  { title: "Staff", tab: "staff", icon: Users },
  { title: "Activity Logs", tab: "activity", icon: Activity },
  { title: "History Logs", tab: "history", icon: History },
  { title: "Settings", tab: "settings", icon: Settings },
];

export function AdminSidebar({ currentTab, onTabChange }: AdminSidebarProps) {
  return (
    <Sidebar className="border-r border-gray-200 dark:border-slate-700 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
      <SidebarHeader className="p-4 border-b border-gray-200 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Smart Waste</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.tab)}
                    className={`w-full transition-colors ${
                      currentTab === item.tab
                        ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-white"
                        : "hover:bg-green-50 hover:text-green-700 dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 dark:border-slate-700 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">admin@smartwaste.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
