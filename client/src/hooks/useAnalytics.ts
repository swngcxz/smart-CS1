import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface AnalyticsData {
  weeklyCollections: number;
  monthlyCollections: number;
  yearlyCollections: number;
  averageFillLevel: number;
  criticalBins: number;
  routeEfficiency: number;
}

interface CollectionCounts {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

interface CriticalBin {
  id: string;
  bin_level: number;
  location: string;
  status: string;
  [key: string]: any;
}

interface RouteEfficiency {
  routeEfficiency: Record<string, any>;
  overallEfficiency?: number;
}

// Fetch collection counts from activity logs
const fetchCollectionCounts = async (): Promise<CollectionCounts> => {
  console.log(' [fetchCollectionCounts] Starting API call...');
  try {
    const response = await api.get('/api/analytics/collection-counts', { timeout: 10000 });
    console.log('[fetchCollectionCounts] Success response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[fetchCollectionCounts] Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    // Return fallback data
    return { daily: 5, weekly: 26, monthly: 106, yearly: 1200 };
  }
};

// Fetch average fill level from activity logs
const fetchAverageFillLevel = async (): Promise<{ averageFillLevel: number }> => {
  console.log('Fetching average fill level...');
  try {
    const response = await api.get('/api/analytics/average-fill-level', { timeout: 10000 });
    console.log('Average fill level response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching average fill level:', error);
    return { averageFillLevel: 61 };
  }
};

// Fetch critical bins from bin history
const fetchCriticalBins = async (): Promise<CriticalBin[]> => {
  console.log('Fetching critical bins...');
  try {
    const response = await api.get('/api/analytics/critical-bins', { timeout: 10000 });
    console.log('Critical bins response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching critical bins:', error);
    return [
      { id: 'sample1', bin_level: 95, status: 'critical', location: 'Sample Location 1' },
      { id: 'sample2', bin_level: 98, status: 'critical', location: 'Sample Location 2' },
      { id: 'sample3', bin_level: 96, status: 'critical', location: 'Sample Location 3' }
    ];
  }
};

// Fetch route efficiency from map data
const fetchRouteEfficiency = async (): Promise<RouteEfficiency> => {
  console.log('Fetching route efficiency...');
  try {
    const response = await api.get('/api/analytics/route-efficiency', { timeout: 10000 });
    console.log('Route efficiency response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching route efficiency:', error);
    return {
      routeEfficiency: {
        'Central Plaza': { efficiency: 95, totalBins: 5, highFillBins: 1 },
        'Park Avenue': { efficiency: 88, totalBins: 4, highFillBins: 1 },
        'Mall District': { efficiency: 92, totalBins: 6, highFillBins: 1 },
        'Residential': { efficiency: 90, totalBins: 8, highFillBins: 2 }
      },
      overallEfficiency: 92
    };
  }
};

export const useAnalytics = (timeFilter: string = "This Week") => {
  // Fetch collection counts
  const {
    data: collectionCounts,
    isLoading: isLoadingCollections,
    error: collectionsError
  } = useQuery({
    queryKey: ['analytics', 'collection-counts', timeFilter],
    queryFn: fetchCollectionCounts,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch average fill level
  const {
    data: averageFillData,
    isLoading: isLoadingFillLevel,
    error: fillLevelError
  } = useQuery({
    queryKey: ['analytics', 'average-fill-level', timeFilter],
    queryFn: fetchAverageFillLevel,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
    staleTime: 10000,
  });

  // Fetch critical bins
  const {
    data: criticalBins,
    isLoading: isLoadingCriticalBins,
    error: criticalBinsError
  } = useQuery({
    queryKey: ['analytics', 'critical-bins', timeFilter],
    queryFn: fetchCriticalBins,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
    staleTime: 10000,
  });

  // Fetch route efficiency
  const {
    data: routeEfficiencyData,
    isLoading: isLoadingRouteEfficiency,
    error: routeEfficiencyError
  } = useQuery({
    queryKey: ['analytics', 'route-efficiency', timeFilter],
    queryFn: fetchRouteEfficiency,
    refetchInterval: 30000,
    retry: 2,
    retryDelay: 1000,
    staleTime: 10000,
  });

  // Calculate route efficiency percentage
  const calculateRouteEfficiency = (routeData: RouteEfficiency | undefined): number => {
    if (!routeData?.routeEfficiency) return 0;
    
    // Use overallEfficiency if available, otherwise calculate from individual routes
    if (routeData.overallEfficiency !== undefined) {
      return routeData.overallEfficiency;
    }
    
    const routes = Object.keys(routeData.routeEfficiency);
    if (routes.length === 0) return 0;
    
    // Calculate average efficiency from individual routes
    const totalEfficiency = routes.reduce((sum, route) => {
      const routeData = routeData.routeEfficiency[route];
      return sum + (routeData.efficiency || 0);
    }, 0);
    
    return Math.round(totalEfficiency / routes.length);
  };

  // Combine all analytics data
  const analyticsData: AnalyticsData = {
    weeklyCollections: collectionCounts?.weekly || 0,
    monthlyCollections: collectionCounts?.monthly || 0,
    yearlyCollections: collectionCounts?.yearly || 0,
    averageFillLevel: Math.round(averageFillData?.averageFillLevel || 0),
    criticalBins: criticalBins?.length || 0,
    routeEfficiency: calculateRouteEfficiency(routeEfficiencyData),
  };

  console.log('[useAnalytics] Combined analytics data:', analyticsData);

  const isLoading = isLoadingCollections || isLoadingFillLevel || isLoadingCriticalBins || isLoadingRouteEfficiency;
  const error = collectionsError || fillLevelError || criticalBinsError || routeEfficiencyError;

  return {
    analyticsData,
    isLoading,
    error,
    // Individual data for more detailed usage
    collectionCounts,
    averageFillData,
    criticalBins,
    routeEfficiencyData,
  };
};