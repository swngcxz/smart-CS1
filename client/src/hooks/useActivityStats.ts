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

export function useActivityStats(autoRefreshInterval: number = 30000) {
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
      const response = await api.get("/api/activity-stats");
      
      if (response.data.success && response.data.stats) {
        const newStats = {
          collections: response.data.stats.collections,
          alerts: response.data.stats.alerts,
          maintenance: response.data.stats.maintenance,
          routeChanges: response.data.stats.routeChanges,
          inProgress: response.data.stats.inProgress,
          totalActivities: response.data.stats.totalActivities
        };

        setStats(newStats);
      } else {
        throw new Error("Invalid response format");
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
      icon: "⚠️",
      description: "Pending status alerts"
    },
    {
      label: "In-Progress",
      value: stats.inProgress,
      color: "text-orange-600 dark:text-orange-400",
      icon: "🔄",
      description: "Tasks in progress"
    },
    {
      label: "Collections",
      value: stats.collections,
      color: "text-green-600 dark:text-green-400",
      icon: "📊",
      description: "Completed collections"
    },
    {
      label: "Maintenance",
      value: stats.maintenance,
      color: "text-blue-600 dark:text-blue-400",
      icon: "🔧",
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
