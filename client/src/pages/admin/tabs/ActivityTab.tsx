import React, { useEffect } from 'react';
import { RoleBasedActivityLogs } from "@/components/RoleBasedActivityLogs";

export function ActivityTab() {
  const handleRefresh = async () => {
    // Refresh activity logs
    console.log('Refreshing activity logs...');
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
    <div>
      {/* Activity Logs Section */}
      <div>
        <RoleBasedActivityLogs onRefresh={handleRefresh} />
      </div>
    </div>
  );
}