import { Home, BarChart3, Users, MapPin, Activity, Settings, Recycle, History, LogOut, Trash2, Trophy } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserInfo } from "@/hooks/useUserInfo";

type AdminSidebarProps = {
  currentTab: string;
  onTabChange: (value: string) => void;
};

const menuItems = [
  { title: "Dashboard", tab: "overview", icon: Home },
  { title: "Map View", tab: "map", icon: MapPin },
  { title: "Schedule", tab: "schedule", icon: Calendar },
  { title: "Staff", tab: "staff", icon: Users },
  { title: "Performance", tab: "performance", icon: Trophy },
  { title: "Activity Logs", tab: "activity", icon: Activity },
  { title: "History Logs", tab: "history", icon: History },
  { title: "Bin History", tab: "bin-history", icon: Trash2 },
  { title: "Settings", tab: "settings", icon: Settings },
];

export function AdminSidebar({ currentTab, onTabChange }: AdminSidebarProps) {
  const { logout, loading } = useAuth();
  const { user } = useCurrentUser();
  const { userInfo } = useUserInfo();
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0">
            {(userInfo?.profileImageUrl || userInfo?.profileImagePath) ? (
              <img 
                src={userInfo.profileImageUrl || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/${userInfo.profileImagePath}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default icon if image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  const fallback = target.nextElementSibling as HTMLElement;
                  target.style.display = 'none';
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center ${(userInfo?.profileImageUrl || userInfo?.profileImagePath) ? 'hidden' : 'flex'}`}>
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@smartwaste.com'}</p>
          </div>
        </div>

      </SidebarFooter>
    </Sidebar>
  );
}
