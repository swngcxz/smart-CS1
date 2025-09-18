import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface ActivityLog {
  id: string;
  type?: string;
  time?: string;
  activity?: string;
  user?: string;
  priority?: string;
  [key: string]: any;
}

export function useActivityLogs(userId?: string, autoRefreshInterval: number = 30000) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.get(`/api/activitylogs/${userId}`);
      setLogs(res.data.activities || []);
      setUser(res.data.user || null);
    } catch (err: any) {
      setLogs([]);
      setUser(null);
      setError(err?.response?.data?.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchLogs();
      }, autoRefreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [fetchLogs, autoRefreshInterval]);

  const refetch = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, user, loading, error, refetch };
}
