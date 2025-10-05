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
      {/* Role-based header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isAdmin ? 'Completed Activity Logs' : 'All Activity Logs'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isAdmin 
              ? 'View completed activity logs and task assignments'
              : 'View and manage all system activity logs and task assignments'
            }
          </p>
        </div>
        {logs.logs.length > 0 && (
          <div className="text-sm text-gray-500">
            {logs.logs.length} {isAdmin ? 'completed' : 'total'} log{logs.logs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {/* Activity logs table */}
      <ActivityLogsTable
        logs={logs.logs}
        loading={logs.loading}
        error={logs.error}
        onRefresh={logs.refetch}
      />
      
      {/* Empty state with role-specific message - only show for staff */}
      {!logs.loading && !logs.error && logs.logs.length === 0 && !isAdmin && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            {getEmptyMessage()}
          </div>
          <p className="text-sm text-gray-400">
            You can create new tasks through the bin management system or manual task assignment.
          </p>
        </div>
      )}
    </div>
  );
}
