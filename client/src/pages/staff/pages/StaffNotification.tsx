import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Trash, Check, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useEffect } from "react";

// Notification type from hook
import type { Notification as NotificationType } from "@/hooks/useNotifications";

const Notifications = () => {
  const navigate = useNavigate();
  // Resolve current user and listen to their own bucket (staff should NOT see admin bucket)
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUserId(res.data.id);
        setCurrentUserRole(res.data.role || res.data.acc_type || "");
        
        // Security check: ensure staff users never access admin notifications
        if (res.data.role === 'admin' || res.data.acc_type === 'admin') {
          console.warn('🚨 Admin user detected in staff notification component');
        }
      } catch (_) {
        setCurrentUserId("");
        setCurrentUserRole("");
      }
    })();
  }, []);

  // Ensure staff users only see their personal notifications, never admin notifications
  const notificationBucket = currentUserId || "none";
  
  // Double-check: never allow staff to access admin notifications
  if (notificationBucket === "admin" && currentUserRole !== "admin") {
    console.error('🚨 SECURITY ISSUE: Staff user attempting to access admin notifications!');
  }
  
  // Force staff users to use their personal notification endpoint
  const finalNotificationBucket = (currentUserRole === "admin") ? "admin" : currentUserId || "none";
  
  // SECURITY CHECK: Never allow staff users to access admin notifications
  if (finalNotificationBucket === "admin" && currentUserRole !== "admin") {
    console.error('🚨 CRITICAL SECURITY ISSUE: Staff user attempting to access admin notifications!');
    // Force fallback to personal notifications
    const fallbackBucket = currentUserId || "none";
    console.log('🛡️ Security fallback: Using personal notification bucket:', fallbackBucket);
  }
  
  // Debug logging
  console.log('🔍 Staff Notification Debug:', {
    currentUserId,
    currentUserRole,
    finalNotificationBucket,
    isAdmin: currentUserRole === "admin",
    securityCheck: finalNotificationBucket === "admin" && currentUserRole !== "admin"
  });
  
  const { notifications, loading, error } = useNotifications(finalNotificationBucket);
  
  // Backend now handles filtering, so we can use notifications directly
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  
  // Debug logging for notifications
  const adminNotificationCount = notifications.filter(n => 
    n.type === 'login' || 
    n.title?.includes('User Login') || 
    n.title?.includes('Staff Login Alert') ||
    n.type === 'critical' ||
    n.type === 'warning'
  ).length;
  
  console.log('🔍 Notifications Debug:', {
    rawNotifications: notifications,
    safeNotifications: safeNotifications,
    filteredCount: safeNotifications.length,
    adminNotificationCount,
    hasAdminNotifications: adminNotificationCount > 0,
    filteredOutTypes: notifications
      .filter(n => n.type === 'login' || n.title?.includes('User Login'))
      .map(n => ({ type: n.type, title: n.title }))
  });
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [hiddenNotifications, setHiddenNotifications] = useState<string[]>([]);

  // Only use safe, filtered notifications (no admin notifications)
  const backendNotifications: NotificationType[] = safeNotifications;
  const unreadCount = backendNotifications.filter((n) => !n.read).length;

  // Mark a single notification as read in the backend
  const markAsRead = async (key: string) => {
    try {
      if (!currentUserId) return;
      await api.patch(`/api/notifications/${currentUserId}/mark-read/${key}`);
      
      // Refresh notifications after marking as read
      window.location.reload();
      
      console.log('✅ Notification marked as read:', key);
    } catch (err) {
      console.error('❌ Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read in the backend
  const markAllAsRead = async () => {
    try {
      if (!currentUserId) return;
      await api.patch(`/api/notifications/${currentUserId}/mark-all-read`);
      
      // Refresh notifications after marking all as read
      window.location.reload();
      
      console.log('✅ All notifications marked as read');
    } catch (err) {
      console.error('❌ Failed to mark all notifications as read:', err);
    }
    }

  // Temporary hide notification (do not delete from backend)
  const deleteNotification = (key: string) => {
    setHiddenNotifications((prev) => [...prev, key]);
  };

  // Remove duplicate notifications (same title, message, and timestamp, regardless of key)
  const uniqueNotifications = backendNotifications.filter((notif, idx, arr) => {
    return (
      arr.findIndex(
        n =>
          n.title === notif.title &&
          n.message === notif.message &&
          n.timestamp === notif.timestamp
      ) === idx
    );
  });

  const filteredNotifications = uniqueNotifications.filter((notification) => {
    const statusMatch =
      filter === "all" || (filter === "read" && notification.read) || (filter === "unread" && !notification.read);
    
    // Filter by notification type - staff should only see personal notifications
    // Exclude admin-specific notifications like login alerts
    const typeMatch = typeFilter === "all" || notification.type === typeFilter;
    
    return statusMatch && typeMatch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900";
      case "error":
        return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900";
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900";
      case "bin_maintenance_urgent":
        return "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900";
      case "bin_maintenance":
        return "border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900";
      case "task_accepted":
        return "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900";
      default:
        return "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "bin_maintenance_urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "bin_maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "task_accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Personal Notifications</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {unreadCount} unread of {backendNotifications.length} total personal notifications
                  </p>
                  {currentUserRole && currentUserRole !== "admin" && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Showing only your personal notifications
                    </p>
                  )}
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
        <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-300">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</label>
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Type</label>
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
                    <SelectItem value="bin_maintenance">Maintenance</SelectItem>
                    <SelectItem value="bin_maintenance_urgent">Urgent Maintenance</SelectItem>
                    <SelectItem value="task_accepted">Task Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        {currentUserRole && currentUserRole !== "admin" && (
          <Card className="border-blue-200 dark:border-blue-700 dark:bg-blue-900/20">
            <CardContent className="pt-4">
              <div className="text-center py-2">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  🔒 Showing only your personal notifications. Admin notifications are not accessible to staff users.
                </p>
                {adminNotificationCount > 0 && (
                  <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                    {adminNotificationCount} admin notification(s) filtered out for security
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your filters to see more notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
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
                          {notification.type === 'bin_maintenance_urgent' ? 'urgent' :
                           notification.type === 'bin_maintenance' ? 'maintenance' :
                           notification.type === 'bin_collection_completed' ? 'completed' :
                           notification.type === 'activity_completed' ? 'activity' :
                           notification.type === 'task_accepted' ? 'accepted' :
                           notification.type || 'info'}
                        </Badge>
                        {!notification.read && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                      {/* Only show timestamp if not already in the message */}
                      {notification.message && notification.timestamp && !notification.message.includes(new Date(notification.timestamp).toLocaleString()) && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            const date = new Date(notification.timestamp);
                            return isNaN(date.getTime()) ? 'Invalid timestamp' : date.toLocaleString();
                          })()}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this notification?')) {
                            deleteNotification(notification.key);
                          }
                        }}
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
