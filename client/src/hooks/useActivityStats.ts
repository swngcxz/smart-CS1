import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface ActivityStats {
  collections: number;
  alerts: number;
  maintenance: number;
  routeChanges: number;
  inProgress: number;
  totalActivities: number;
}

export interface ActivityOverviewCard {
  label: string;
  value: number;
  color: string;
  icon: string;
  description: string;
}

export function useActivityStats(autoRefreshInterval: number = 10000) {
  const [stats, setStats] = useState<ActivityStats>({
    collections: 0,
    alerts: 0,
    maintenance: 0,
    routeChanges: 0,
    inProgress: 0,
    totalActivities: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch activity logs instead of activity-stats endpoint
      const response = await api.get("/api/activitylogs");
      
      if (response.data.activities) {
        const activities = response.data.activities;
        
        // Calculate statistics from activity logs
        const alerts = activities.filter(activity => 
          activity.status === 'pending'
        ).length;

        const inProgress = activities.filter(activity => 
          activity.status === 'in_progress'
        ).length;

        const collections = activities.filter(activity => 
          activity.status === 'done' && (
            activity.activity_type === 'collection' || 
            activity.activity_type === 'task_assignment' ||
            activity.activity_type === 'bin_collection' ||
            activity.activity_type === 'bin_emptied'
          )
        ).length;

        const maintenance = activities.filter(activity => 
          activity.activity_type === 'maintenance' || 
          activity.activity_type === 'repair' ||
          activity.activity_type === 'cleaning'
        ).length;

        const routeChanges = activities.filter(activity => 
          activity.activity_type === 'route_change' || 
          activity.activity_type === 'schedule_update' ||
          activity.activity_type === 'route_update'
        ).length;

        const newStats = {
          collections,
          alerts,
          maintenance,
          routeChanges,
          inProgress,
          totalActivities: activities.length
        };

        console.log('[ACTIVITY STATS] Calculated from activity logs:', newStats);
        setStats(newStats);
      } else {
        throw new Error('No activities data received');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch activity statistics");
      setStats({
        collections: 0,
        alerts: 0,
        maintenance: 0,
        routeChanges: 0,
        inProgress: 0,
        totalActivities: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh if interval is set
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchStats();
      }, autoRefreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchStats, autoRefreshInterval]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  // Generate overview cards data in the exact order specified
  const overviewCards: ActivityOverviewCard[] = [
    {
      label: "Alerts",
      value: stats.alerts,
      color: "text-red-600 dark:text-red-400",
      icon: "",
      description: "Pending status alerts"
    },
    {
      label: "In-Progress",
      value: stats.inProgress,
      color: "text-orange-600 dark:text-orange-400",
      icon: "",
      description: "Tasks in progress"
    },
    {
      label: "Collections",
      value: stats.collections,
      color: "text-green-600 dark:text-green-400",
      icon: "",
      description: "Completed collections"
    },
    {
      label: "Maintenance",
      value: stats.maintenance,
      color: "text-blue-600 dark:text-blue-400",
      icon: "",
      description: "Maintenance tasks"
    }
  ];

  return { 
    stats, 
    overviewCards, 
    loading, 
    error, 
    refetch 
  };
}
