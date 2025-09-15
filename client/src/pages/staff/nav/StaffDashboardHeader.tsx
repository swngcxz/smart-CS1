import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationPopover } from "@/components/modal/NotificationPopover";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import api from "@/lib/api";

export function StaffDashboardHeader() {
  const [open, setOpen] = useState(false);
  const { logout, loading } = useAuth();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        if (mounted) {
          setCurrentUser({ id: res.data.id, role: res.data.role });
        }
      } catch (_) {
        if (mounted) setCurrentUser(null);
      } finally {
        if (mounted) setUserLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Get notifications for staff users
  const notificationBucket = currentUser?.role === "admin" ? "admin" : currentUser?.id || "none";
  const { notifications } = useNotifications(notificationBucket);
  const backendNotifications = Array.isArray(notifications) ? notifications : [];
  
  // Filter for bin collection completed notifications and activity logs with done status
  const binCollectionNotifications = backendNotifications.filter(
    (n) => (n.type === 'bin_collection_completed' || n.type === 'activity_completed') && !n.read
  );
  const unreadBinCollectionCount = binCollectionNotifications.length;

  const handleConfirmLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <header className="bg-background dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <p className="text-sm text-Black-800 dark:text-gray-400">Welcome back, Staff</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <NotificationPopover />
            {unreadBinCollectionCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {unreadBinCollectionCount}
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md dark:bg-gray-900">
              <DialogHeader>
                <DialogTitle className="text-lg">Confirm Logout</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600 dark:text-gray-400">Are you sure you want to log out?</p>
              <DialogFooter className="mt-4">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmLogout} disabled={loading}>
                  {loading ? "Logging out..." : "Logout"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
