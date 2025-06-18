import { useState } from "react";
import { Bell, Trash, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Bin Collection Alert",
    message: "Trash bin TB001 at Main Street & 5th Ave is 95% full and needs collection",
    timestamp: "2024-06-18 14:30:00",
    type: "warning",
    read: false,
  },
  {
    id: "2",
    title: "System Maintenance",
    message: "Scheduled maintenance will occur tonight from 12:00 AM to 2:00 AM",
    timestamp: "2024-06-18 12:15:00",
    type: "info",
    read: false,
  },
  {
    id: "3",
    title: "Collection Completed",
    message: "Trash bin TB003 at University Campus has been successfully emptied",
    timestamp: "2024-06-18 10:45:00",
    type: "success",
    read: true,
  },
  {
    id: "4",
    title: "Sensor Error",
    message: "GPS sensor malfunction detected in bin TB005 at Beach Boardwalk",
    timestamp: "2024-06-17 16:20:00",
    type: "error",
    read: false,
  },
];

export function NotificationPopover() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
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
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                  !notification.read ? "bg-green-50 dark:bg-green-900" : "bg-white dark:bg-gray-800"
                } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{notification.title}</h4>
                      <Badge className={getTypeBadge(notification.type)}>{notification.type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
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
