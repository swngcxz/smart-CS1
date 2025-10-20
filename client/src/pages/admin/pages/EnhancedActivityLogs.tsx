import React from 'react';
import { ActivityOverviewCards } from "@/components/ActivityOverviewCards";
import { ActivityLogsTable } from "@/components/ActivityLogsTable";
import { useActivityStats } from "@/hooks/useActivityStats";
import { useActivityLogsApi } from "@/hooks/useActivityLogsApi";

export function EnhancedActivityLogs() {
  const { stats, overviewCards, loading: statsLoading, error: statsError, refetch: refetchStats } = useActivityStats();
  const { logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useActivityLogsApi(100, 0, undefined, undefined, 5000);

  const handleRefresh = () => {
    refetchStats();
    refetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Activity Overview Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity Overview</h2>
        <ActivityOverviewCards 
          cards={overviewCards} 
          loading={statsLoading} 
          error={statsError}
        />
      </div>

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