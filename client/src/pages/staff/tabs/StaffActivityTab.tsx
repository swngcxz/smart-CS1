import React, { useEffect, useState } from 'react';
import { RoleBasedActivityLogs } from "@/components/RoleBasedActivityLogs";
import { StaffActivitySkeleton } from "@/components/skeletons/StaffActivitySkeleton";

export function StaffActivityTab() {
  const [loading, setLoading] = useState(true);

  const handleRefresh = async () => {
    // Refresh activity logs
    console.log('Refreshing activity logs...');
    setLoading(true);
    // Simulate loading time
    setTimeout(() => setLoading(false), 1000);
  };

  // Listen for activity log creation events to refresh data
  useEffect(() => {
    const handleActivityLogCreated = () => {
      console.log('Activity log created, refreshing data...');
      handleRefresh();
    };

    window.addEventListener('activityLogCreated', handleActivityLogCreated);
    
    // Simulate initial loading
    setTimeout(() => setLoading(false), 1500);
    
    return () => {
      window.removeEventListener('activityLogCreated', handleActivityLogCreated);
    };
  }, []);

  // Show skeleton while loading
  if (loading) {
    return <StaffActivitySkeleton />;
  }

  return (
    <div className="space-y-6">

      {/* Activity Logs Section */}
      <div>
        <RoleBasedActivityLogs onRefresh={handleRefresh} />
      </div>
    </div>
  );
}
