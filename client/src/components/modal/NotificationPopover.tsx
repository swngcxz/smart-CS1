import React, { useEffect, useState } from "react";
import { Bell, Trash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification as NotificationType } from "@/hooks/useNotifications";
import api from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function NotificationPopover() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // Determine notification bucket based on user role
  const getNotificationBucket = (user: { id: string; role: string } | null) => {
    if (!user) return "none";

    // For admin, use "admin" bucket to see all notifications
    if (user.role === "admin") return "admin";

    // For all other users (staff, janitor, driver, maintenance), use their individual bucket
    // Staff users should only see their own task-related notifications, not admin login notifications
    return user.id;
  };

  const notificationBucket = getNotificationBucket(currentUser);
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(notificationBucket);

  const backendNotifications: NotificationType[] = Array.isArray(notifications) ? notifications : [];
  const formatLoginMessage = (title?: string, message?: string): string => {
    if (!message) return "";

    const capitalizeWords = (str: string) => str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

    if (title?.toLowerCase() === "user login") {
      const name = message.replace(/\(.*?\)/g, "").trim();
      const formattedName = capitalizeWords(name);
      return `${formattedName} just logged in to their account.`;
    }

    return message;
  };

  // Debug logging to see what notifications we're getting
  if (currentUser?.role === "admin" && backendNotifications.length > 0) {
    console.log("NotificationPopover - Admin notifications:", backendNotifications);
    console.log("NotificationPopover - Current user role:", currentUser.role);
  }

  // Filter out admin login notifications for admin users
  const filteredNotifications = backendNotifications.filter((notification) => {
    // Exclude admin login notifications (since admin doesn't need to be notified about their own logins)
    if (currentUser?.role === "admin") {
      // Check if this is an admin login notification in multiple ways
      const isAdminLogin =
        // Check by type and message
        (notification.type === "login" && notification.message && notification.message.includes("(admin)")) ||
        // Check by title and message
        (notification.title === "User Login" && notification.message && notification.message.includes("(admin)")) ||
        // Check if message contains admin role
        (notification.message && notification.message.includes("(admin)")) ||
        // Check if message contains admin email or name
        (notification.message && notification.message.toLowerCase().includes("angel canete"));

      if (isAdminLogin) {
        console.log("NotificationPopover - Filtering out admin login notification:", notification);
        return false;
      }
    }
    return true;
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "task_accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "activity_completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "bin_maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "bin_maintenance_urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "login":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const handleSeeAll = () => {
    setIsOpen(false);
    if (currentUser?.role === "admin") {
      navigate("/admin/notifications");
    } else {
      navigate("/staff/notifications");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
        align="end"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notification List (show only latest 3) */}
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
          ) : (
            filteredNotifications.slice(0, 3).map((notification) => (
              <div
                key={notification.key}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                  !notification.read ? "bg-green-50 dark:bg-green-900" : "bg-white dark:bg-gray-800"
                } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{notification.title}</h4>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {formatLoginMessage(notification.title, notification.message)}
                    </p>

                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {notification.timestamp
                        ? new Date(notification.timestamp).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : ""}
                    </p>
                  </div>
                  <div className="ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        className="w-36 rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-md text-xs"
                      >
                        {!notification.read && (
                          <DropdownMenuItem
                            onClick={() => markAsRead(notification.key)}
                            className="text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/40 cursor-pointer text-xs py-1.5"
                          >
                            <Check className="h-3.5 w-3.5 mr-2" />
                            Mark as Read
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedNotification(notification.key);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/40 cursor-pointer text-xs py-1.5"
                        >
                          <Trash className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full text-black-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900 rounded-lg"
              onClick={handleSeeAll}
            >
              See All Notifications
            </Button>
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-xs rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-md font-semibold text-gray-900 dark:text-white">
                Delete Notification
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Are you sure you want to delete this notification? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-3 flex justify-end space-x-2">
              <AlertDialogCancel className="text-xs rounded-md px-2.5 py-1">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedNotification) deleteNotification(selectedNotification);
                  setShowDeleteDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-md px-3 py-1"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PopoverContent>
    </Popover>
  );
}
``;
