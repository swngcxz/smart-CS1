import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAllActivityLogs, useAdminActivityLogs } from "@/hooks/useActivityLogsApi";
import { ActivityLogsTable } from "./ActivityLogsTable";
import { DoneActivityDetailsModal } from "@/components/modals/DoneActivityDetailsModal";
import { useState } from "react";

interface RoleBasedActivityLogsProps {
  onRefresh?: () => void;
}

export function RoleBasedActivityLogs({ onRefresh }: RoleBasedActivityLogsProps) {
  const { user, isAuthenticated } = useAuth();

  // Admin users see only activity logs with "done" status
  const adminLogs = useAdminActivityLogs(100, 0);

  // Staff users see all activity logs (assigned and unassigned)
  const staffLogs = useAllActivityLogs(100, 0);

  // Determine which logs to use based on user role
  const isAdmin = user?.role === "admin";
  const logs = isAdmin ? adminLogs : staffLogs;

  // Modal states for activity details
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Handler for opening activity details modal
  const handleViewActivity = (activity: any) => {
    console.log("Opening activity modal for:", activity);
    setSelectedActivity(activity);
    setActivityModalOpen(true);
  };

  // Helper function to handle cell clicks for all activities
  const handleCellClick = (e: React.MouseEvent, activity: any) => {
    // Show modal for all activities, regardless of status
    e.preventDefault();
    e.stopPropagation();
    handleViewActivity(activity);
  };

  // Utility functions for formatting
  const formatDisplayDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDisplayTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatActivityDescription = (activity: any) => {
    if (activity.bin_id && activity.bin_location) {
      return `Bin ${activity.bin_id} at ${activity.bin_location}`;
    }
    if (activity.task_note) {
      return activity.task_note;
    }
    return activity.activity_type || "Activity logged";
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "Task_assignment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Bin_emptied":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Route_change":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Schedule_update":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "Bin_alert":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "inprogress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Debug logging
  console.log("RoleBasedActivityLogs Debug:", {
    userRole: user?.role,
    isAdmin,
    adminLogsCount: adminLogs.logs?.length || 0,
    staffLogsCount: staffLogs.logs?.length || 0,
    selectedLogsCount: logs.logs?.length || 0,
    adminLoading: adminLogs.loading,
    staffLoading: staffLogs.loading,
    adminError: adminLogs.error,
    staffError: staffLogs.error,
  });

  // Show loading state
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">Please log in to view activity logs.</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity logs table with modal functionality */}
      <ActivityLogsTable
        logs={logs.logs}
        loading={logs.loading}
        error={logs.error}
        onRefresh={onRefresh || logs.refetch}
        userRole={user?.role}
        onCellClick={handleCellClick}
      />

      {/* Activity Details Modal */}
      <DoneActivityDetailsModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        activity={selectedActivity}
        getActivityTypeColor={getActivityTypeColor}
        getStatusColor={getStatusColor}
        getPriorityColor={getPriorityColor}
        formatDisplayDate={formatDisplayDate}
        formatDisplayTime={formatDisplayTime}
        formatActivityDescription={formatActivityDescription}
      />
    </div>
  );
}
