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
        const cachedData = await AsyncStorage.getItem('binData');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setBinData(parsedData);
          setLastUpdate(parsedData.timestamp);
        }

        // Fetch fresh data from API
        const response = await apiClient.get('/api/bin1');
        
        if (response.data) {
          setBinData(response.data);
          setLastUpdate(Date.now());
          
          // Cache the data
          await AsyncStorage.setItem('binData', JSON.stringify(response.data));
          setError(null);
        }
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
        const response = await apiClient.get('/api/bin1');
        
        if (response.data) {
          setBinData(response.data);
          setLastUpdate(Date.now());
          
          // Cache the data
          await AsyncStorage.setItem('binData', JSON.stringify(response.data));
          setError(null);
        }
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
    
    return bins;
  }, [binData, getStatusFromLevel, getTimeAgo, getNextCollectionTime]);

  // Get real-time location data for mobile
  const getRealTimeLocationData = useCallback((): LocationData => {
    const bins = getWasteBins();
    const realTimeBin = bins[0]; // Get the real-time bin
    
    if (realTimeBin) {
      // Calculate overall level and status for the location
      const overallLevel = realTimeBin.level;
      const status = getStatusFromLevel(overallLevel);
      const nearlyFullCount = overallLevel >= 70 ? 1 : 0;
      
      return {
        name: realTimeBin.location,
        overallLevel: overallLevel,
        status: status,
        lastCollected: realTimeBin.lastCollected,
        nearlyFullCount: nearlyFullCount,
        totalBins: 1,
        bins: [realTimeBin]
      };
    }
    
    // Fallback data if no real-time data available
    return {
      name: 'Central Plaza',
      overallLevel: 50,
      status: 'normal',
      lastCollected: 'Unknown',
      nearlyFullCount: 0,
      totalBins: 1,
      bins: []
    };
  }, [getWasteBins, getStatusFromLevel]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/bin1');
      if (response.data) {
        setBinData(response.data);
        setLastUpdate(Date.now());
        await AsyncStorage.setItem('binData', JSON.stringify(response.data));
      }
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
