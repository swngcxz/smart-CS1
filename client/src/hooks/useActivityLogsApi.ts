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

export function useActivityLogsApi(limit = 100, offset = 0, type?: string, user_id?: string, status?: string, autoRefreshInterval: number = 10000) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDataFetch, setLastDataFetch] = useState<number>(0);

  const fetchLogs = useCallback(async (forceRefresh = false) => {
    // Skip if we have data and it's not a forced refresh
    if (!forceRefresh && logs.length > 0 && !loading) {
      console.log('⏭️ Skipping fetch - data already loaded and not forced');
      return;
    }

    console.log('🔄 fetchLogs called at:', new Date().toLocaleTimeString(), forceRefresh ? '(forced)' : '');
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      if (type) params.append('type', type);
      if (user_id) params.append('user_id', user_id);
      if (status) params.append('status', status);

      const url = `/api/activitylogs?${params.toString()}`;
      console.log('useAllActivityLogs - Fetching from:', url);
      const response = await api.get(url);
      
      console.log('useAllActivityLogs - Response:', {
        activitiesCount: response.data.activities?.length || 0,
        totalCount: response.data.totalCount || 0,
        activities: response.data.activities
      });
      
      setLogs(response.data.activities || []);
      setTotalCount(response.data.totalCount || 0);
      setLastDataFetch(Date.now());
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch activity logs");
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, type, user_id, status, logs.length, loading]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Listen for tab changes to refresh data (only when switching to Activity Logs tab)
  useEffect(() => {
    let lastRefreshTime = 0;
    let lastTabSwitch = 0;
    const MIN_REFRESH_INTERVAL = 10000; // Minimum 10 seconds between refreshes
    const MIN_TAB_SWITCH_INTERVAL = 2000; // Minimum 2 seconds between tab switches

    const handleTabChange = (event: CustomEvent) => {
      const { activeTab } = event.detail || {};
      const now = Date.now();
      
      // Only refresh if switching to activity tab and enough time has passed
      if (activeTab === 'activity') {
        const timeSinceLastRefresh = now - lastRefreshTime;
        const timeSinceLastTabSwitch = now - lastTabSwitch;
        
        // Only refresh if:
        // 1. We don't have data yet (first load)
        // 2. Data is older than 30 seconds AND enough time has passed since last refresh
        // 3. Enough time has passed since last tab switch
        const dataAge = now - lastDataFetch;
        const shouldRefresh = logs.length === 0 || 
          (dataAge > 30000 && timeSinceLastRefresh > MIN_REFRESH_INTERVAL && timeSinceLastTabSwitch > MIN_TAB_SWITCH_INTERVAL);
        
        if (shouldRefresh) {
          console.log('🔄 Switching to Activity Logs tab - refreshing data (data age:', Math.round(dataAge / 1000), 's)');
          fetchLogs(true);
          lastRefreshTime = now;
        } else if (timeSinceLastRefresh <= MIN_REFRESH_INTERVAL) {
          console.log('⏭️ Skipping refresh - too soon since last refresh (', Math.round(timeSinceLastRefresh / 1000), 's ago)');
        } else if (timeSinceLastTabSwitch <= MIN_TAB_SWITCH_INTERVAL) {
          console.log('⏭️ Skipping refresh - too soon since last tab switch (', Math.round(timeSinceLastTabSwitch / 1000), 's ago)');
        } else if (dataAge <= 30000) {
          console.log('⏭️ Skipping refresh - data is fresh (', Math.round(dataAge / 1000), 's old)');
        }
        
        lastTabSwitch = now;
      }
    };

    window.addEventListener('tabChanged', handleTabChange);

    return () => {
      window.removeEventListener('tabChanged', handleTabChange);
    };
  }, [fetchLogs]);

  // Optimized refresh mechanism - single interval with smart checking
  useEffect(() => {
    let isActive = true;
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 2000; // Minimum 2 seconds between refreshes
    
    const performRefresh = () => {
      if (!isActive) return;
      
      const now = Date.now();
      if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
        console.log('⏭️ Skipping refresh - too soon (', Math.round((now - lastRefreshTime) / 1000), 's ago)');
        return; // Skip if too soon
      }
      
      console.log('✅ Performing refresh at:', new Date().toLocaleTimeString());
      lastRefreshTime = now;
      fetchLogs(false); // Regular refresh
    };

    const checkForUpdates = () => {
      if (!isActive) return;
      
      // Check for mobile app refresh flag
      const mobileRefreshFlag = localStorage.getItem('activityLogsNeedRefresh');
      const lastRefresh = localStorage.getItem('activityLogsLastRefresh');
      
      if (mobileRefreshFlag && lastRefresh) {
        const mobileTime = parseInt(mobileRefreshFlag);
        const lastTime = parseInt(lastRefresh);
        
        if (mobileTime > lastTime) {
          console.log('Mobile app triggered refresh - fetching immediately');
          fetchLogs(true); // Force refresh
          localStorage.setItem('activityLogsLastRefresh', Date.now().toString());
          localStorage.removeItem('activityLogsNeedRefresh');
          return;
        }
      }
      
      // Regular auto-refresh if interval is set
      if (autoRefreshInterval > 0) {
        performRefresh();
      }
    };

    // Check immediately on mount
    checkForUpdates();
    
    // Set up single interval for all refresh logic
    const refreshInterval = setInterval(checkForUpdates, autoRefreshInterval > 0 ? autoRefreshInterval : 5000);
    
    return () => {
      isActive = false;
      clearInterval(refreshInterval);
    };
  }, [fetchLogs, autoRefreshInterval]);

  const refetch = useCallback(() => {
    fetchLogs(true); // Force refresh when manually triggered
  }, [fetchLogs]);

  return { logs, loading, error, totalCount, refetch };
}

// Hook for staff users - only shows assigned activity logs
export function useStaffActivityLogs(janitorId: string, limit = 100, offset = 0) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchAssignedLogs = async () => {
      if (!janitorId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());

        const url = `/api/activitylogs/assigned/${janitorId}?${params.toString()}`;
        const response = await api.get(url);
        
        setLogs(response.data.activities || []);
        setTotalCount(response.data.totalCount || 0);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to fetch assigned activity logs");
        setLogs([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedLogs();
  }, [janitorId, limit, offset]);

  const refetch = () => {
    if (janitorId) {
      const fetchAssignedLogs = async () => {
        setLoading(true);
        setError(null);
        
        try {
          const params = new URLSearchParams();
          if (limit) params.append('limit', limit.toString());
          if (offset) params.append('offset', offset.toString());

          const url = `/api/activitylogs/assigned/${janitorId}?${params.toString()}`;
          const response = await api.get(url);
          
          setLogs(response.data.activities || []);
          setTotalCount(response.data.totalCount || 0);
        } catch (err: any) {
          setError(err?.response?.data?.message || err.message || "Failed to fetch assigned activity logs");
          setLogs([]);
          setTotalCount(0);
        } finally {
          setLoading(false);
        }
      };
      fetchAssignedLogs();
    }
  };

  return { logs, loading, error, totalCount, refetch };
}

// Alias for backward compatibility
export const useAllActivityLogs = useActivityLogsApi;

// Hook for admin users - only shows activity logs with "done" status
export function useAdminActivityLogs(limit = 100, offset = 0) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDoneLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        params.append('status', 'done'); // Filter for done status only

        const url = `/api/activitylogs?${params.toString()}`;
        console.log('useAdminActivityLogs - Fetching from:', url);
        const response = await api.get(url);
        
        console.log('useAdminActivityLogs - Response:', {
          activitiesCount: response.data.activities?.length || 0,
          totalCount: response.data.totalCount || 0,
          activities: response.data.activities
        });
        
        setLogs(response.data.activities || []);
        setTotalCount(response.data.totalCount || 0);
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message || "Failed to fetch done activity logs");
        setLogs([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDoneLogs();
  }, [limit, offset]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      params.append('status', 'done'); // Filter for done status only

      const url = `/api/activitylogs?${params.toString()}`;
      const response = await api.get(url);
      
      setLogs(response.data.activities || []);
      setTotalCount(response.data.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to fetch done activity logs");
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, error, totalCount, refetch };
}
