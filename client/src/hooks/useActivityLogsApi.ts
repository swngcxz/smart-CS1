import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface ActivityLog {
  id: string;
  user_id?: string;
  bin_id?: string;
  bin_location?: string;
  bin_status?: string;
  bin_level?: number;
  assigned_janitor_id?: string;
  assigned_janitor_name?: string;
  task_note?: string;
  activity_type?: string;
  timestamp?: string;
  date?: string;
  time?: string;
  status?: string;
  [key: string]: any;
}

export function useActivityLogsApi(limit = 100, offset = 0, type?: string, user_id?: string, autoRefreshInterval: number = 30000) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      if (type) params.append('type', type);
      if (user_id) params.append('user_id', user_id);

      const url = `/api/activitylogs?${params.toString()}`;
      const response = await api.get(url);
      
      setLogs(response.data.activities || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch activity logs");
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, type, user_id]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh if interval is set
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

  return { logs, loading, error, totalCount, refetch };
}

// Alias for backward compatibility
export const useAllActivityLogs = useActivityLogsApi;
