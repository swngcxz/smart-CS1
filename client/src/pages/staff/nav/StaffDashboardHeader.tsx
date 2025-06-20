import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationPopover } from "@/components/modal/NotificationPopover";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

export function StaffDashboardHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleConfirmLogout = () => {
    setOpen(false);
    // Optionally: clear auth/session data
    navigate("/");
  };

  return (
    <header className="bg-background dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Staff</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationPopover />

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
                <Button variant="destructive" onClick={handleConfirmLogout}>
                  Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
