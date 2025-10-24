import { useState, useEffect, useCallback, useRef } from "react";
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
  priority?: string;
  status?: string;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface ActivityLogsCache {
  data: ActivityLog[];
  timestamp: number;
  totalCount: number;
}

export function useOptimizedActivityLogs(
  limit = 100, 
  offset = 0, 
  type?: string, 
  user_id?: string, 
  status?: string,
  autoRefreshInterval: number = 10000
) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDataFetch, setLastDataFetch] = useState<number>(0);
  const cacheRef = useRef<Map<string, ActivityLogsCache>>(new Map());
  const updateQueueRef = useRef<Map<string, Partial<ActivityLog>>>(new Map());
  
  // Cache duration: 2 minutes
  const CACHE_DURATION = 2 * 60 * 1000;
  
  // Generate cache key
  const getCacheKey = useCallback(() => {
    return `activity-logs-${limit}-${offset}-${type || 'all'}-${user_id || 'all'}-${status || 'all'}`;
  }, [limit, offset, type, user_id, status]);
  
  // Get cached data
  const getCachedData = useCallback((): ActivityLogsCache | null => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🚀 Using cached activity logs data');
      return cached;
    }
    
    return null;
  }, [getCacheKey]);
  
  // Set cached data
  const setCachedData = useCallback((data: ActivityLog[], totalCount: number) => {
    const cacheKey = getCacheKey();
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
      totalCount
    });
  }, [getCacheKey]);
  
  // Apply pending updates to logs
  const applyPendingUpdates = useCallback((logs: ActivityLog[]): ActivityLog[] => {
    if (updateQueueRef.current.size === 0) return logs;
    
    console.log('🔄 Applying pending updates to activity logs');
    const updatedLogs = logs.map(log => {
      const updates = updateQueueRef.current.get(log.id);
      if (updates) {
        return { ...log, ...updates };
      }
      return log;
    });
    
    // Clear applied updates
    updateQueueRef.current.clear();
    return updatedLogs;
  }, []);
  
  // Update specific log instantly
  const updateLogInstantly = useCallback((logId: string, updates: Partial<ActivityLog>) => {
    console.log('⚡ Updating log instantly:', logId, updates);
    
    // Add to update queue
    updateQueueRef.current.set(logId, updates);
    
    // Update state immediately
    setLogs(prevLogs => {
      const updatedLogs = prevLogs.map(log => 
        log.id === logId ? { ...log, ...updates } : log
      );
      
      // Update cache
      const cacheKey = getCacheKey();
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        const updatedCache = {
          ...cached,
          data: updatedLogs
        };
        cacheRef.current.set(cacheKey, updatedCache);
      }
      
      return updatedLogs;
    });
  }, [getCacheKey]);
  
  // Fetch logs from API
  const fetchLogs = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check cache first
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        setLogs(applyPendingUpdates(cached.data));
        setTotalCount(cached.totalCount);
        setLastDataFetch(cached.timestamp);
        return;
      }
    }
    
    console.log('🔄 Fetching activity logs from API...');
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
      const response = await api.get(url);
      
      const fetchedLogs = response.data.activities || [];
      const fetchedTotalCount = response.data.totalCount || 0;
      
      // Apply pending updates to fresh data
      const updatedLogs = applyPendingUpdates(fetchedLogs);
      
      setLogs(updatedLogs);
      setTotalCount(fetchedTotalCount);
      setLastDataFetch(now);
      
      // Cache the data
      setCachedData(updatedLogs, fetchedTotalCount);
      
      console.log('✅ Activity logs fetched and cached');
    } catch (err: any) {
      console.error('❌ Error fetching activity logs:', err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, type, user_id, status, getCachedData, applyPendingUpdates, setCachedData]);
  
  // Optimized refresh with smart caching
  const refetch = useCallback((forceRefresh = false) => {
    fetchLogs(forceRefresh);
  }, [fetchLogs]);
  
  // Handle task assignment with instant UI update
  const handleTaskAssignment = useCallback(async (
    activityId: string, 
    janitorId: string, 
    janitorName: string, 
    taskNote?: string
  ) => {
    console.log('🎯 Handling task assignment with instant update');
    
    // Update UI instantly
    updateLogInstantly(activityId, {
      assigned_janitor_id: janitorId,
      assigned_janitor_name: janitorName,
      status: 'in_progress',
      task_note: taskNote || undefined
    });
    
    try {
      // Make API call in background
      const response = await api.post("/api/assign-task", {
        activityId,
        janitorId,
        janitorName,
        taskNote: taskNote || ""
      });
      
      console.log('✅ Task assignment successful:', response.data);
      
      // Update with server response if different
      if (response.data.activity) {
        updateLogInstantly(activityId, response.data.activity);
      }
      
    } catch (err: any) {
      console.error('❌ Task assignment failed:', err);
      
      // Revert the instant update on error
      refetch(true);
      
      throw err;
    }
  }, [updateLogInstantly, refetch]);
  
  // Handle status updates with instant UI update
  const handleStatusUpdate = useCallback(async (
    activityId: string, 
    newStatus: string, 
    additionalData?: Partial<ActivityLog>
  ) => {
    console.log('🔄 Handling status update with instant update');
    
    // Update UI instantly
    updateLogInstantly(activityId, {
      status: newStatus,
      ...additionalData
    });
    
    try {
      // Make API call in background
      const response = await api.patch(`/api/activity-logs/${activityId}`, {
        status: newStatus,
        ...additionalData
      });
      
      console.log('✅ Status update successful:', response.data);
      
    } catch (err: any) {
      console.error('❌ Status update failed:', err);
      
      // Revert the instant update on error
      refetch(true);
      
      throw err;
    }
  }, [updateLogInstantly, refetch]);
  
  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);
  
  // Smart auto-refresh with cache checking
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    
    let isActive = true;
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 5000; // Minimum 5 seconds between refreshes
    
    const performRefresh = () => {
      if (!isActive) return;
      
      const now = Date.now();
      if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
        return;
      }
      
      // Check if data is stale
      const dataAge = now - lastDataFetch;
      if (dataAge > CACHE_DURATION) {
        console.log('🔄 Data is stale, refreshing...');
        fetchLogs(false);
        lastRefreshTime = now;
      }
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
          console.log('📱 Mobile app triggered refresh - fetching immediately');
          fetchLogs(true);
          localStorage.setItem('activityLogsLastRefresh', Date.now().toString());
          localStorage.removeItem('activityLogsNeedRefresh');
          return;
        }
      }
      
      performRefresh();
    };
    
    // Check immediately on mount
    checkForUpdates();
    
    // Set up interval
    const refreshInterval = setInterval(checkForUpdates, autoRefreshInterval);
    
    return () => {
      isActive = false;
      clearInterval(refreshInterval);
    };
  }, [fetchLogs, autoRefreshInterval, lastDataFetch, CACHE_DURATION]);
  
  return { 
    logs, 
    loading, 
    error, 
    totalCount, 
    refetch,
    handleTaskAssignment,
    handleStatusUpdate,
    updateLogInstantly,
    lastDataFetch,
    isStale: (Date.now() - lastDataFetch) > CACHE_DURATION
  };
}
