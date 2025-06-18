import { useState } from "react";
import { Bell, Trash, Check, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  {
    id: "5",
    title: "New User Registration",
    message: "New user Alice Johnson has registered and completed their first waste disposal",
    timestamp: "2024-06-17 14:22:00",
    type: "info",
    read: true,
  },
  {
    id: "6",
    title: "Bin Collection Alert",
    message: "Trash bin TB002 at Central Park East is 88% full",
    timestamp: "2024-06-17 11:15:00",
    type: "warning",
    read: true,
  },
  {
    id: "7",
    title: "Feedback Received",
    message: "New 5-star feedback received from user Bob Smith for bin TB004",
    timestamp: "2024-06-16 18:45:00",
    type: "success",
    read: true,
  },
  {
    id: "8",
    title: "System Update",
    message: "Waste monitoring system has been updated to version 2.1.3",
    timestamp: "2024-06-16 09:30:00",
    type: "info",
    read: true,
  },
];

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const filteredNotifications = notifications.filter((notification) => {
    const statusMatch =
      filter === "all" || (filter === "read" && notification.read) || (filter === "unread" && !notification.read);
    const typeMatch = typeFilter === "all" || notification.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "success":
        return "border-green-200 bg-green-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "success":
        return "bg-green-100 text-green-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-green-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-full">
                <Bell className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">All Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount} unread of {notifications.length} total notifications
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

        {/* Filters */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="border-green-200">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more notifications.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`${getTypeColor(notification.type)} ${
                  !notification.read ? "ring-2 ring-green-200" : ""
                } transition-all hover:shadow-md`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <Badge className={getTypeBadge(notification.type)}>{notification.type}</Badge>
                        {!notification.read && <Badge className="bg-green-100 text-green-800">New</Badge>}
                      </div>
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      <p className="text-sm text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
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

export default Notifications;
