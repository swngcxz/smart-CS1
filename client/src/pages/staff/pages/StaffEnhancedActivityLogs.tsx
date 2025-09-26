import React from 'react';
import { ActivityOverviewCards } from "@/components/ActivityOverviewCards";
import { ActivityLogsTable } from "@/components/ActivityLogsTable";
import { useActivityStats } from "@/hooks/useActivityStats";
import { useActivityLogsApi } from "@/hooks/useActivityLogsApi";

export function StaffEnhancedActivityLogs() {
  const { stats, overviewCards, loading: statsLoading, error: statsError, refetch: refetchStats } = useActivityStats();
  const { logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useActivityLogsApi();

  const handleRefresh = async () => {
    // Prioritize table refresh first
    await refetchLogs();
    // Then refresh overview cards
    refetchStats();
  };

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