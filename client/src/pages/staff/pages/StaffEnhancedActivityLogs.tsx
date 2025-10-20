import React, { useEffect } from 'react';
import { ActivityOverviewCards } from "@/components/ActivityOverviewCards";
import { ActivityLogsTable } from "@/components/ActivityLogsTable";
import { useActivityStats } from "@/hooks/useActivityStats";
import { useActivityLogsApi } from "@/hooks/useActivityLogsApi";

export function StaffEnhancedActivityLogs() {
  const { stats, overviewCards, loading: statsLoading, error: statsError, refetch: refetchStats } = useActivityStats();
  const { logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useActivityLogsApi(100, 0, undefined, undefined, 5000);

  const handleRefresh = async () => {
    // Prioritize table refresh first
    await refetchLogs();
    // Then refresh overview cards
    refetchStats();
  };

  // Listen for activity log creation events to refresh data
  useEffect(() => {
    const handleActivityLogCreated = () => {
      console.log('Activity log created, refreshing data...');
      handleRefresh();
    };

    window.addEventListener('activityLogCreated', handleActivityLogCreated);
    
    return () => {
      window.removeEventListener('activityLogCreated', handleActivityLogCreated);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Activity Overview Cards */}
      <ActivityOverviewCards 
        cards={overviewCards} 
        loading={statsLoading} 
        error={statsError}
      />

      {/* Activity Logs Table */}
      <ActivityLogsTable 
        logs={logs}
        loading={logsLoading}
        error={logsError}
        onRefresh={handleRefresh}
      />
    </div>
  );
}