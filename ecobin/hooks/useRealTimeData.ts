import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/utils/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BinData {
  weight_kg: number;
  weight_percent: number;
  distance_cm: number;
  height_percent: number;
  bin_level: number;
  latitude: number;
  longitude: number;
  gps_valid: boolean;
  satellites: number;
  timestamp: number;
  bin_id?: string;
  type?: string;
  name?: string;
  mainLocation?: string;
  last_active?: number;
  gps_timestamp?: number;
  // Backup coordinates from Firebase
  backup_latitude?: number;
  backup_longitude?: number;
  backup_timestamp?: string;
  backup_source?: string;
}

export interface WasteBin {
  id: string;
  location: string;
  level: number;
  status: 'normal' | 'warning' | 'critical';
  lastCollected: string;
  capacity: string;
  wasteType: string;
  nextCollection: string;
  binData?: BinData;
}

export interface LocationData {
  name: string;
  overallLevel: number;
  status: 'normal' | 'warning' | 'critical';
  lastCollected: string;
  nearlyFullCount: number;
  totalBins: number;
  bins: WasteBin[];
}

export function useRealTimeData() {
  const [binData, setBinData] = useState<BinData | null>(null);
  const [bin2Data, setBin2Data] = useState<BinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Helper function to get time ago
  const getTimeAgo = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }, []);

  // Helper function to get status from level
  const getStatusFromLevel = useCallback((level: number): 'normal' | 'warning' | 'critical' => {
    if (level >= 85) return 'critical';
    if (level >= 70) return 'warning';
    if (level > 0) return 'normal';
    return 'normal';
  }, []);

  // Helper function to get next collection time
  const getNextCollectionTime = useCallback((level: number): string => {
    if (level >= 85) return 'Immediate';
    if (level >= 70) return 'Today 3:00 PM';
    return 'Tomorrow 9:00 AM';
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Try to get cached data first
        const cachedBin1Data = await AsyncStorage.getItem('binData');
        const cachedBin2Data = await AsyncStorage.getItem('bin2Data');
        
        if (cachedBin1Data) {
          const parsedData = JSON.parse(cachedBin1Data);
          setBinData(parsedData);
        }
        
        if (cachedBin2Data) {
          const parsedData = JSON.parse(cachedBin2Data);
          setBin2Data(parsedData);
        }

        // Fetch fresh data from API for both bins
        const [bin1Response, bin2Response] = await Promise.allSettled([
          apiClient.get('/api/bin1'),
          apiClient.get('/api/bin2')
        ]);
        
        if (bin1Response.status === 'fulfilled' && bin1Response.value.data) {
          setBinData(bin1Response.value.data);
          await AsyncStorage.setItem('binData', JSON.stringify(bin1Response.value.data));
        }
        
        if (bin2Response.status === 'fulfilled' && bin2Response.value.data) {
          setBin2Data(bin2Response.value.data);
          await AsyncStorage.setItem('bin2Data', JSON.stringify(bin2Response.value.data));
        }
        
        setLastUpdate(Date.now());
        setError(null);
      } catch (err: any) {
        // Silently handle network errors to prevent LogBox display
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Set up real-time updates using polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Fetch data for both bins
        const [bin1Response, bin2Response] = await Promise.allSettled([
          apiClient.get('/api/bin1'),
          apiClient.get('/api/bin2')
        ]);
        
        if (bin1Response.status === 'fulfilled' && bin1Response.value.data) {
          setBinData(bin1Response.value.data);
          await AsyncStorage.setItem('binData', JSON.stringify(bin1Response.value.data));
        }
        
        if (bin2Response.status === 'fulfilled' && bin2Response.value.data) {
          setBin2Data(bin2Response.value.data);
          await AsyncStorage.setItem('bin2Data', JSON.stringify(bin2Response.value.data));
        }
        
        setLastUpdate(Date.now());
        setError(null);
      } catch (err: any) {
        // Silently handle network errors to prevent LogBox display
        setError(err.message || 'Failed to fetch real-time data');
      }
    }, 3000); // Poll every 3 seconds for mobile optimization

    return () => clearInterval(interval);
  }, []);

  // Convert Firebase data to waste bin format
  const getWasteBins = useCallback((): WasteBin[] => {
    const bins: WasteBin[] = [];
    
    // Add bin1 data
    if (binData) {
      const calculatedLevel = (binData.bin_level && binData.bin_level > 0) ? binData.bin_level : (binData.weight_percent || 0);
      
      bins.push({
        id: 'bin1',
        location: binData.name || 'Central Plaza',
        level: calculatedLevel,
        status: getStatusFromLevel(calculatedLevel),
        lastCollected: getTimeAgo(binData.timestamp),
        capacity: '500L',
        wasteType: binData.type || 'Mixed',
        nextCollection: getNextCollectionTime(calculatedLevel),
        binData: binData
      });
    }
    
    // Add bin2 data
    if (bin2Data) {
      const calculatedLevel = (bin2Data.bin_level && bin2Data.bin_level > 0) ? bin2Data.bin_level : (bin2Data.weight_percent || 0);
      
      bins.push({
        id: 'bin2',
        location: bin2Data.name || 'Secondary Location',
        level: calculatedLevel,
        status: getStatusFromLevel(calculatedLevel),
        lastCollected: getTimeAgo(bin2Data.timestamp),
        capacity: '500L',
        wasteType: bin2Data.type || 'Mixed',
        nextCollection: getNextCollectionTime(calculatedLevel),
        binData: bin2Data
      });
    }
    
    return bins;
  }, [binData, bin2Data, getStatusFromLevel, getTimeAgo, getNextCollectionTime]);

  // Get real-time location data for mobile
  const getRealTimeLocationData = useCallback((): LocationData => {
    const bins = getWasteBins();
    
    if (bins.length > 0) {
      // Calculate overall level and status for all bins
      const totalLevel = bins.reduce((sum, bin) => sum + bin.level, 0);
      const overallLevel = totalLevel / bins.length;
      const status = getStatusFromLevel(overallLevel);
      const nearlyFullCount = bins.filter(bin => bin.level >= 70).length;
      
      return {
        name: bins.length > 1 ? 'Multiple Locations' : bins[0].location,
        overallLevel: overallLevel,
        status: status,
        lastCollected: bins[0].lastCollected,
        nearlyFullCount: nearlyFullCount,
        totalBins: bins.length,
        bins: bins
      };
    }
    
    // Fallback data if no real-time data available
    return {
      name: 'Central Plaza',
      overallLevel: 50,
      status: 'normal',
      lastCollected: 'Unknown',
      nearlyFullCount: 0,
      totalBins: 0,
      bins: []
    };
  }, [getWasteBins, getStatusFromLevel]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [bin1Response, bin2Response] = await Promise.allSettled([
        apiClient.get('/api/bin1'),
        apiClient.get('/api/bin2')
      ]);
      
      if (bin1Response.status === 'fulfilled' && bin1Response.value.data) {
        setBinData(bin1Response.value.data);
        await AsyncStorage.setItem('binData', JSON.stringify(bin1Response.value.data));
      }
      
      if (bin2Response.status === 'fulfilled' && bin2Response.value.data) {
        setBin2Data(bin2Response.value.data);
        await AsyncStorage.setItem('bin2Data', JSON.stringify(bin2Response.value.data));
      }
      
      setLastUpdate(Date.now());
      setError(null);
    } catch (err: any) {
      // Silently handle network errors to prevent LogBox display
      setError(err.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    binData,
    bin2Data,
    wasteBins: getWasteBins(),
    realTimeLocationData: getRealTimeLocationData(),
    loading,
    error,
    lastUpdate,
    refresh,
    isGPSValid: () => {
      return binData?.gps_valid && binData?.latitude && binData?.longitude;
    },
    getCurrentGPSLocation: () => {
      return binData?.gps_valid ? binData : null;
    }
  };
}

// Helper function to get status from level (exported for use in components)
export function getStatusFromLevel(level: number): 'normal' | 'warning' | 'critical' {
  if (level >= 85) return 'critical';
  if (level >= 70) return 'warning';
  if (level > 0) return 'normal';
  return 'normal';
}

// Helper function to get fill color based on level
export function getFillColor(level: number): string {
  if (level <= 50) return '#4caf50';
  if (level <= 80) return '#ff9800';
  return '#f44336';
}

// Helper function to get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'normal': return '#4caf50';
    case 'warning': return '#ff9800';
    case 'critical': return '#f44336';
    default: return '#4caf50';
  }
}
