import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllActivityLogs, useStaffActivityLogs, useAdminActivityLogs } from '@/hooks/useActivityLogsApi';
import { ActivityLogsTable } from './ActivityLogsTable';

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
  const isAdmin = user?.role === 'admin';
  const logs = isAdmin ? adminLogs : staffLogs;
  
  // Debug logging
  console.log('🔍 RoleBasedActivityLogs Debug:', {
    userRole: user?.role,
    isAdmin,
    adminLogsCount: adminLogs.logs?.length || 0,
    staffLogsCount: staffLogs.logs?.length || 0,
    selectedLogsCount: logs.logs?.length || 0,
    adminLoading: adminLogs.loading,
    staffLoading: staffLogs.loading,
    adminError: adminLogs.error,
    staffError: staffLogs.error,
    adminLogs: adminLogs.logs,
    staffLogs: staffLogs.logs
  });
  
  // Show loading state
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Please log in to view activity logs.
      </div>
    );
  }
  
  // Show appropriate message based on role
  const getEmptyMessage = () => {
    if (isAdmin) {
      return "No completed activity logs found. Tasks will appear here once they are marked as done.";
    } else {
      return "No activity logs found. Create some tasks to get started.";
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Activity logs table */}
      <ActivityLogsTable
        logs={logs.logs}
        loading={logs.loading}
        error={logs.error}
        onRefresh={onRefresh || logs.refetch}
      />
      
    </div>
  );
}
