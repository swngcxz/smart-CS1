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

type StaffSidebarProps = {
  currentTab: string;
  onTabChange: (value: string) => void;
};

const menuItems = [
  { title: "Dashboard", tab: "overview", icon: Home },
  { title: "Map View", tab: "map", icon: MapPin },
  { title: "Schedule", tab: "schedule", icon: Calendar },
  { title: "Staff", tab: "staff", icon: Users },
  { title: "Activity", tab: "activity", icon: Activity },
  { title: "Feedback", tab: "feedback", icon: Activity },
  { title: "Settings", tab: "settings", icon: Settings },
];

export function StaffSidebar({ currentTab, onTabChange }: StaffSidebarProps) {
  return (
    <Sidebar className="border-r border-gray-200 dark:border-slate-700 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
      <SidebarHeader className="p-4 border-b border-gray-200 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="flex items-center justify-center gap-1">
          <img src="../public/logo-final2.png" alt="EcoBin Logo" className="w-8 h-8" />
         <h2 className="text-xl font-bold  text-Black-900 dark:text-white">ECOBIN</h2>
        </div>
      </SidebarHeader>


      <SidebarContent className="p-2 bg-background dark:bg-gray-900 text-gray-900 dark:text-white">
        <SidebarGroup>
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
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Staff</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">staff@smartwaste.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
