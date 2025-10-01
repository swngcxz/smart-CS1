import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Trash, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

// Notification type from hook
import type { Notification as NotificationType } from "@/hooks/useNotifications";

const StaffNotifications = () => {
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUserId(res.data.id);
      } catch (_) {
        setCurrentUserId("");
      }
    })();
  }, []);

  // Get notifications for current staff user
  const { notifications, loading, error } = useNotifications(currentUserId);
  
  // Backend filters notifications, so we can use them directly
  const staffNotifications: NotificationType[] = Array.isArray(notifications) ? notifications : [];
  const unreadCount = staffNotifications.filter((n) => !n.read).length;

  // Mark a single notification as read
  const markAsRead = async (key: string) => {
    try {
      if (!currentUserId) return;
      await api.patch(`/api/notifications/${currentUserId}/mark-read/${key}`);
      window.location.reload();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (!currentUserId) return;
      await api.patch(`/api/notifications/${currentUserId}/mark-all-read`);
      window.location.reload();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Get notification type styling
  const getTypeColor = (type: string) => {
    switch (type) {
      case "task_accepted":
        return "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900";
      case "activity_completed":
        return "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900";
      case "bin_maintenance":
        return "border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900";
      case "bin_maintenance_urgent":
        return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900";
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900";
    }
  };

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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "task_accepted":
        return "Task Accepted";
      case "activity_completed":
        return "Task Completed";
      case "bin_maintenance":
        return "Maintenance";
      case "bin_maintenance_urgent":
        return "Urgent Maintenance";
      default:
        return "Notification";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-gray-600 dark:text-gray-300">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-red-600 dark:text-red-400">Error loading notifications: {error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-green-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Bell className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {unreadCount} unread of {staffNotifications.length} total notifications
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Showing: Task Acceptance, Task Completed, Bin Maintenance
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} className="bg-green-600 hover:bg-green-700 text-white">
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {staffNotifications.length === 0 ? (
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    You don't have any staff notifications yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            staffNotifications.map((notification) => (
              <Card
                key={notification.key}
                className={`${getTypeColor(notification.type || "info")} ${
                  !notification.read ? "ring-2 ring-green-200 dark:ring-green-600" : ""
                } transition-all hover:shadow-md`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                        <Badge className={getTypeBadge(notification.type || "info")}>
                          {getTypeLabel(notification.type || "info")}
                        </Badge>
                        {!notification.read && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                      {notification.timestamp && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-800"
                          onClick={() => markAsRead(notification.key)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffNotifications;
