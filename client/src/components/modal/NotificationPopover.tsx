
import React, { useEffect, useState } from "react";
import { Bell, Trash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification as NotificationType } from "@/hooks/useNotifications";
import api from "@/lib/api";

export function NotificationPopover() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
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

  const notificationBucket = currentUser?.role === "admin" ? "admin" : currentUser?.id || "none";
  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(notificationBucket);
  const backendNotifications: NotificationType[] = Array.isArray(notifications) ? notifications : [];
  const unreadCount = backendNotifications.filter((n) => !n.read).length;

  const getTypeBadge = (type: string) => {
    switch (type) {
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
    navigate("/notifications");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" align="end">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
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
        </div>

        <div className="max-h-96 overflow-y-auto">
          {backendNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
          ) : (
            backendNotifications.map((notification) => (
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
                      <Badge className={getTypeBadge(notification.type || "info")}>
                        {notification.type || "info"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                    {notification.userRole && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Role: {notification.userRole}
                        </span>
                        {notification.userEmail && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • {notification.userEmail}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        onClick={() => markAsRead(notification.key)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => deleteNotification(notification.key)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {backendNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900"
              onClick={handleSeeAll}
            >
              See All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
