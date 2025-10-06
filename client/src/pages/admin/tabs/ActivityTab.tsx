import React, { useEffect } from 'react';
import { RoleBasedActivityLogs } from "@/components/RoleBasedActivityLogs";
import { ActivityOverviewCards } from "@/components/ActivityOverviewCards";
import { useActivityStats } from "@/hooks/useActivityStats";

export function ActivityTab() {
  const { stats, overviewCards, loading: statsLoading, error: statsError, refetch: refetchStats } = useActivityStats();

  const handleRefresh = async () => {
    // Refresh overview cards
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
      {/* Activity Overview Cards - The Four Boxes */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Activity Overview
        </h2>
        <ActivityOverviewCards 
          cards={overviewCards} 
          loading={statsLoading} 
          error={statsError}
        />
      </div>

      {/* Activity Logs Section */}
      <div>
        <RoleBasedActivityLogs onRefresh={handleRefresh} />
      </div>
    </div>
  );
}