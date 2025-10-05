import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Trash, Trash2, Check, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Notification type from hook
import type { Notification as NotificationType } from "@/hooks/useNotifications";

const Notification = () => {
  const navigate = useNavigate();
  // Resolve current user and listen to their own bucket (staff should NOT see admin bucket)
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const itemsPerPage = 5;
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUserId(res.data.id);
        setCurrentUserRole(res.data.role || res.data.acc_type || "");

        // Security check: ensure staff users never access admin notifications
        if (res.data.role === "admin" || res.data.acc_type === "admin") {
          console.warn("🚨 Admin user detected in staff notification component");
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
    console.error("🚨 SECURITY ISSUE: Staff user attempting to access admin notifications!");
  }

  // Force staff users to use their personal notification endpoint
  const finalNotificationBucket = currentUserRole === "admin" ? "admin" : currentUserId || "none";

  // SECURITY CHECK: Never allow staff users to access admin notifications
  if (finalNotificationBucket === "admin" && currentUserRole !== "admin") {
    console.error("🚨 CRITICAL SECURITY ISSUE: Staff user attempting to access admin notifications!");
    // Force fallback to personal notifications
    const fallbackBucket = currentUserId || "none";
    console.log("🛡️ Security fallback: Using personal notification bucket:", fallbackBucket);
  }

  // Debug logging
  console.log("🔍 Staff Notification Debug:", {
    currentUserId,
    currentUserRole,
    finalNotificationBucket,
    isAdmin: currentUserRole === "admin",
    securityCheck: finalNotificationBucket === "admin" && currentUserRole !== "admin",
  });

  const { notifications, loading, error } = useNotifications(finalNotificationBucket);

  // Backend now handles filtering, so we can use notifications directly
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Debug logging for notifications
  const adminNotificationCount = notifications.filter(
    (n) =>
      n.type === "login" ||
      n.title?.includes("User Login") ||
      n.title?.includes("Staff Login Alert") ||
      n.type === "critical" ||
      n.type === "warning"
  ).length;

  console.log("🔍 Notifications Debug:", {
    rawNotifications: notifications,
    safeNotifications: safeNotifications,
    filteredCount: safeNotifications.length,
    adminNotificationCount,
    hasAdminNotifications: adminNotificationCount > 0,
    filteredOutTypes: notifications
      .filter((n) => n.type === "login" || n.title?.includes("User Login"))
      .map((n) => ({ type: n.type, title: n.title })),
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

      console.log("✅ Notification marked as read:", key);
    } catch (err) {
      console.error("❌ Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read in the backend
  const markAllAsRead = async () => {
    try {
      if (!currentUserId) return;
      await api.patch(`/api/notifications/${currentUserId}/mark-all-read`);

      // Refresh notifications after marking all as read
      window.location.reload();

      console.log("✅ All notifications marked as read");
    } catch (err) {
      console.error("❌ Failed to mark all notifications as read:", err);
    }
  };
  // Delete all notifications from the backend
  const deleteAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) return;

    try {
      if (notificationBucket === "admin") {
        await api.delete(`/api/notifications/admin/clear-all`);
      } else {
        await api.delete(`/api/notifications/${notificationBucket}/clear-all`);
      }

      // Refresh UI after deletion
      window.location.reload();

      console.log(`All ${notificationBucket} notifications deleted`);
    } catch (err) {
      console.error(`Failed to delete all ${notificationBucket} notifications:`, err);
    }
  };
  // Temporary hide notification (do not delete from backend)
  const deleteNotification = (key: string) => {
    setHiddenNotifications((prev) => [...prev, key]);
  };

  // Remove duplicate notifications (same title, message, and timestamp, regardless of key)
  const uniqueNotifications = backendNotifications.filter((notif, idx, arr) => {
    return (
      arr.findIndex(
        (n) => n.title === notif.title && n.message === notif.message && n.timestamp === notif.timestamp
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
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
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
    <div className="min-h-screen bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 p-6">
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
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Personal Notifications</h1>
                <p className="text-gray-600 dark:text-gray-400">{backendNotifications.length} Notifications</p>
              </div>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex items-center">
              {unreadCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={markAllAsRead}
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Mark all as read
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Mark all as read</TooltipContent>
                </Tooltip>
              )}

              {backendNotifications.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowDeleteAllDialog(true)}
                      variant="ghost"
                      size="icon"
                      className="text-red-700 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete all</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </div>

        {/* Filters */}

        <div className="flex gap-4">
          <div className="flex-1">
            {/* Status Filter (Icon-only trigger) */}
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger
                // Minimalist style with Green focus ring
                className="border-gray-200 dark:border-gray-700 dark:bg-gray-900/50 hover:border-gray-400 focus:ring-1 focus:ring-green-600 transition-all text-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  {/* Icon */}
                  <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <SelectValue placeholder="Filter by Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 border-gray-700">
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            {/* Type Filter (Icon-only trigger) */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger
                // Minimalist style with Green focus ring
                className="border-gray-200 dark:border-gray-700 dark:bg-gray-900/50 hover:border-gray-400 focus:ring-1 focus:ring-green-600 transition-all text-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  {/* Icon */}
                  <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <SelectValue placeholder="Filter by Type" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-900 border-gray-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {paginatedNotifications.length === 0 ? (
            <Card className="border-green-200 dark:border-green-700 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-sm text-gray-900 dark:text-white mb-2">No notifications found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your filters to see more notifications.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            paginatedNotifications.map((notification) => (
              <Card
                key={notification.key}
                className={`
    bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 transition-all hover:shadow-md
    ${!notification.read ? "border-l-4 border-l-green-800" : ""}
  `}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{notification.title}</h3>
                        <Badge className={getTypeBadge(notification.type || "info")}>
                          {notification.type === "bin_maintenance_urgent"
                            ? "Urgent"
                            : notification.type === "bin_maintenance"
                            ? "Maintenance"
                            : notification.type === "bin_collection_completed"
                            ? "Completed"
                            : notification.type === "activity_completed"
                            ? "Activity"
                            : notification.type === "task_accepted"
                            ? "Accepted"
                            : notification.type || "info"}
                        </Badge>
                        {!notification.read && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            New
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                      {/* Only show timestamp if not already in the message */}
                      {notification.message &&
                        notification.timestamp &&
                        !notification.message.includes(new Date(notification.timestamp).toLocaleString()) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        )}
                    </div>
                    <div className="ml-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          {!notification.read && (
                            <DropdownMenuItem
                              onClick={() => markAsRead(notification.key)}
                              className="text-green-700 hover:bg-green-50 dark:hover:bg-green-900/40 cursor-pointer"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this notification?")) {
                                deleteNotification(notification.key);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Pagination Controls */}
        {filteredNotifications.length > itemsPerPage && (
          <div className="flex items-center justify-center mt-6 space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="text-sm dark:border-gray-700 dark:text-gray-300"
            >
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 text-sm ${
                    currentPage === i + 1
                      ? "bg-green-700 text-white hover:bg-green-800"
                      : "dark:border-gray-700 dark:text-gray-300"
                  }`}
                >
                  {i + 1}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="text-sm dark:border-gray-700 dark:text-gray-300"
            >
              Next
            </Button>
          </div>
        )}
      </div>
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-sm rounded-2xl p-6 border border-gray-200 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete All Notifications?
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              This action cannot be undone. All notifications will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              className="rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await deleteAllNotifications();
                setShowDeleteAllDialog(false);
              }}
              className="rounded-md bg-red-600 text-white hover:bg-red-700"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notification;
