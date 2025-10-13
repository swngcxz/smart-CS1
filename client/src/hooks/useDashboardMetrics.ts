import { useState, useEffect, useCallback } from "react";
import { useActivityLogsApi, ActivityLog } from "./useActivityLogsApi";
import api from "@/lib/api";

interface DashboardMetrics {
  weeklyCollections: number;
  averageFillLevel: number;
  criticalBins: number;
  routeEfficiency: number;
}

interface WeeklyCollectionData {
  count: number;
  logs: ActivityLog[];
}

interface AverageFillLevelData {
  average: number;
  totalLogs: number;
}

interface CriticalBinData {
  count: number;
  bins: any[];
}

export const useDashboardMetrics = (timeFilter: "week" | "month" | "year" = "week") => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    weeklyCollections: 0,
    averageFillLevel: 0,
    criticalBins: 0,
    routeEfficiency: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all activity logs with "done" status
  const { logs: allActivityLogs, loading: logsLoading, error: logsError, refetch: refetchLogs } = 
    useActivityLogsApi(1000, 0, undefined, undefined, "done", 60000); // Refresh every minute, filter for done status

  // Get bin history for critical bins - using direct API call instead of useBinHistory hook
  const [binHistoryData, setBinHistoryData] = useState<any>(null);
  const [binHistoryLoading, setBinHistoryLoading] = useState(false);
  const [binHistoryError, setBinHistoryError] = useState<string | null>(null);

  // Fetch bin history data
  const fetchBinHistory = useCallback(async () => {
    setBinHistoryLoading(true);
    setBinHistoryError(null);
    
    try {
      const response = await api.get('/api/bin-history');
      
      if (response.data && response.data.success && response.data.records) {
        setBinHistoryData(response.data);
        console.log('Bin History Data:', {
          totalRecords: response.data.records.length,
          stats: response.data.stats,
          criticalCount: response.data.stats?.criticalCount || 0
        });
      } else {
        setBinHistoryData(null);
        setBinHistoryError(response.data?.message || 'No bin history data received');
      }
    } catch (err: any) {
      console.error('Error fetching bin history:', err);
      setBinHistoryError(err?.response?.data?.message || err.message || 'Failed to fetch bin history');
      setBinHistoryData(null);
    } finally {
      setBinHistoryLoading(false);
    }
  }, []);

  // Fetch bin history on component mount and periodically
  useEffect(() => {
    fetchBinHistory();
    
    // Refresh every 2 minutes
    const interval = setInterval(() => {
      fetchBinHistory();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [fetchBinHistory]);

  // Calculate collections from activity logs with "done" status based on time period
  const calculateCollections = useCallback((): WeeklyCollectionData => {
    if (!allActivityLogs || allActivityLogs.length === 0) {
      console.log('No activity logs available');
      return { count: 0, logs: [] };
    }

    const now = new Date();
    let startDate: Date;

    // Calculate start date based on time filter
    switch (timeFilter) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1); // Monday
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
    }

    // Filter logs from the specified time period with "done" status
    const filteredLogs = allActivityLogs.filter((log) => {
      if (!log.created_at || log.status !== "done") return false;
      
      const logDate = new Date(log.created_at);
      return logDate >= startDate;
    });

    console.log(`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Collections Calculation:`, {
      timeFilter,
      totalLogs: allActivityLogs.length,
      doneLogs: allActivityLogs.filter(log => log.status === "done").length,
      filteredLogs: filteredLogs.length,
      startDate: startDate.toISOString(),
      allLogsStatus: allActivityLogs.map(log => ({ id: log.id, status: log.status, created_at: log.created_at })),
      filteredLogsDetails: filteredLogs.map(log => ({ id: log.id, status: log.status, created_at: log.created_at, bin_level: log.bin_level }))
    });

    return {
      count: filteredLogs.length,
      logs: filteredLogs
    };
  }, [allActivityLogs, timeFilter]);

  // Calculate average fill level from activity logs with "done" status based on time period
  const calculateAverageFillLevel = useCallback((): AverageFillLevelData => {
    if (!allActivityLogs || allActivityLogs.length === 0) {
      console.log('No activity logs available for fill level calculation');
      return { average: 0, totalLogs: 0 };
    }

    const now = new Date();
    let startDate: Date;

    // Calculate start date based on time filter
    switch (timeFilter) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1); // Monday
        startDate.setHours(0, 0, 0, 0);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
    }

    // Filter logs with "done" status, valid bin_level, and within time period
    const doneLogsWithLevel = allActivityLogs.filter((log) => {
      if (!log.created_at || log.status !== "done") return false;
      if (log.bin_level === undefined || log.bin_level === null || typeof log.bin_level !== 'number') return false;
      
      const logDate = new Date(log.created_at);
      return logDate >= startDate;
    });

    console.log(`Average Fill Level Calculation Debug (${timeFilter}):`, {
      timeFilter,
      totalLogs: allActivityLogs.length,
      doneLogs: allActivityLogs.filter(log => log.status === "done").length,
      doneLogsWithLevel: doneLogsWithLevel.length,
      startDate: startDate.toISOString(),
      allLogsWithBinLevel: allActivityLogs.map(log => ({ 
        id: log.id, 
        status: log.status, 
        bin_level: log.bin_level,
        bin_level_type: typeof log.bin_level,
        created_at: log.created_at
      })),
      validLevels: doneLogsWithLevel.map(log => log.bin_level)
    });

    if (doneLogsWithLevel.length === 0) {
      return { average: 0, totalLogs: 0 };
    }

    const totalLevel = doneLogsWithLevel.reduce((sum, log) => sum + log.bin_level!, 0);
    const average = Math.round(totalLevel / doneLogsWithLevel.length);

    console.log(`Average Fill Level Calculation (${timeFilter}):`, {
      totalDoneLogs: doneLogsWithLevel.length,
      average,
      totalLevel,
      sampleLevels: doneLogsWithLevel.slice(0, 5).map(log => log.bin_level)
    });

    return {
      average,
      totalLogs: doneLogsWithLevel.length
    };
  }, [allActivityLogs, timeFilter]);

  // Calculate critical bins from bin history data
  const calculateCriticalBins = useCallback((): CriticalBinData => {
    if (!binHistoryData || !binHistoryData.records || binHistoryData.records.length === 0) {
      console.log('No bin history data available for critical bins calculation');
      return { count: 0, bins: [] };
    }

    // Use the stats from the API response if available, otherwise calculate manually
    let criticalCount = 0;
    let criticalBins = [];

    if (binHistoryData.stats && binHistoryData.stats.criticalCount !== undefined) {
      // Use the pre-calculated stats from the API
      criticalCount = binHistoryData.stats.criticalCount;
      criticalBins = binHistoryData.records.filter((record: any) => 
        record.status === 'CRITICAL' || record.status === 'ERROR' || record.status === 'MALFUNCTION'
      );
    } else {
      // Calculate manually from records
      criticalBins = binHistoryData.records.filter((record: any) => {
        return record.status === 'CRITICAL' || 
               record.status === 'ERROR' || 
               record.status === 'MALFUNCTION' ||
               record.binLevel > 85; // Consider bins with >85% fill as critical
      });
      criticalCount = criticalBins.length;
    }

    console.log('Critical Bins Calculation:', {
      totalRecords: binHistoryData.records.length,
      criticalCount,
      stats: binHistoryData.stats,
      criticalBins: criticalBins.length,
      sampleCriticalBins: criticalBins.slice(0, 3).map((bin: any) => ({
        id: bin.binId,
        level: bin.binLevel,
        status: bin.status
      }))
    });

    return {
      count: criticalCount,
      bins: criticalBins
    };
  }, [binHistoryData]);

  // Calculate route efficiency (placeholder implementation)
  const calculateRouteEfficiency = useCallback((): number => {
    // Since we're only fetching done logs now, we need to fetch all logs for proper efficiency calculation
    // For now, let's return a reasonable efficiency based on the done logs we have
    if (!allActivityLogs || allActivityLogs.length === 0) {
      return 0;
    }

    // Since we're filtering for done status, all logs are completed
    // This is a simplified calculation - in a real scenario, you'd want to compare done vs total
    const efficiency = Math.min(100, Math.round((allActivityLogs.length / 10) * 100)); // Assume 10 is a reasonable baseline
    
    console.log('Route Efficiency Calculation:', {
      doneLogs: allActivityLogs.length,
      efficiency
    });

    return efficiency;
  }, [allActivityLogs]);

  // Update metrics when data changes
  useEffect(() => {
    if (logsLoading || binHistoryLoading) {
      setLoading(true);
      return;
    }

    setLoading(false);

    try {
      const collections = calculateCollections();
      const averageFillLevel = calculateAverageFillLevel();
      const criticalBins = calculateCriticalBins();
      const routeEfficiency = calculateRouteEfficiency();

      const newMetrics: DashboardMetrics = {
        weeklyCollections: collections.count,
        averageFillLevel: averageFillLevel.average,
        criticalBins: criticalBins.count,
        routeEfficiency: routeEfficiency,
      };

      console.log(`Dashboard Metrics Updated (${timeFilter}):`, newMetrics);
      setMetrics(newMetrics);
      setError(null);
    } catch (err: any) {
      console.error('Error calculating dashboard metrics:', err);
      setError(err.message || 'Failed to calculate dashboard metrics');
    }
  }, [
    allActivityLogs,
    binHistoryData,
    logsLoading,
    binHistoryLoading,
    calculateCollections,
    calculateAverageFillLevel,
    calculateCriticalBins,
    calculateRouteEfficiency,
    timeFilter
  ]);

  const refetch = useCallback(() => {
    refetchLogs();
    fetchBinHistory();
  }, [refetchLogs, fetchBinHistory]);

  return {
    metrics,
    loading: loading || logsLoading || binHistoryLoading,
    error: error || logsError || binHistoryError,
    refetch,
    // Additional data for debugging
    collectionData: calculateCollections(),
    averageFillLevelData: calculateAverageFillLevel(),
    criticalBinData: calculateCriticalBins(),
  };
};
