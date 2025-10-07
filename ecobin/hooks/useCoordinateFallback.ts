import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../utils/apiService';

export interface CoordinateData {
  latitude: number;
  longitude: number;
  source: 'live' | 'backup' | 'stale' | 'offline' | 'default';
  status: 'live' | 'stale' | 'offline';
  gpsValid: boolean;
  satellites: number;
  timestamp?: string;
  lastUpdate?: string;
}

export interface CoordinateFallbackOptions {
  binId: string;
  defaultCoordinates?: [number, number];
  refreshInterval?: number;
}

export function useCoordinateFallback(options: CoordinateFallbackOptions) {
  const { binId, defaultCoordinates = [10.24371, 123.786917], refreshInterval = 30000 } = options;
  
  const [coordinates, setCoordinates] = useState<CoordinateData>({
    latitude: defaultCoordinates[0],
    longitude: defaultCoordinates[1],
    source: 'default',
    status: 'offline',
    gpsValid: false,
    satellites: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch coordinates with fallback logic
  const fetchCoordinates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[COORDINATE FALLBACK] Fetching coordinates for ${binId}...`);
      
      // Try to get dynamic status first (most accurate)
      try {
        const statusResponse = await apiService.getDynamicBinStatus(binId);
        const dynamicStatus = statusResponse?.status;
        
        if (dynamicStatus) {
          const newCoordinates: CoordinateData = {
            latitude: dynamicStatus.latitude,
            longitude: dynamicStatus.longitude,
            source: dynamicStatus.coordinatesSource as any,
            status: dynamicStatus.status as any,
            gpsValid: dynamicStatus.gpsValid,
            satellites: dynamicStatus.satellites,
            timestamp: dynamicStatus.lastUpdate,
            lastUpdate: new Date().toISOString()
          };
          
          setCoordinates(newCoordinates);
          console.log(`[COORDINATE FALLBACK] Dynamic status: ${dynamicStatus.status} (${dynamicStatus.coordinatesSource})`);
          return;
        }
      } catch (statusError) {
        console.warn('[COORDINATE FALLBACK] Dynamic status API failed, trying display coordinates...');
      }
      
      // Fallback to display coordinates API
      try {
        const displayResponse = await apiService.getBinCoordinatesForDisplay(binId);
        const coordinatesData = displayResponse?.coordinates;
        
        if (coordinatesData && coordinatesData.latitude && coordinatesData.longitude) {
          const newCoordinates: CoordinateData = {
            latitude: coordinatesData.latitude,
            longitude: coordinatesData.longitude,
            source: coordinatesData.source as any || 'unknown',
            status: coordinatesData.gps_valid ? 'live' : 'offline',
            gpsValid: coordinatesData.gps_valid || false,
            satellites: 0, // Not available in display API
            timestamp: coordinatesData.timestamp,
            lastUpdate: new Date().toISOString()
          };
          
          setCoordinates(newCoordinates);
          console.log(`[COORDINATE FALLBACK] Display coordinates: ${coordinatesData.source}`);
          return;
        }
      } catch (displayError) {
        console.warn('[COORDINATE FALLBACK] Display coordinates API failed, using default...');
      }
      
      // Final fallback to default coordinates
      const defaultCoords: CoordinateData = {
        latitude: defaultCoordinates[0],
        longitude: defaultCoordinates[1],
        source: 'default',
        status: 'offline',
        gpsValid: false,
        satellites: 0,
        lastUpdate: new Date().toISOString()
      };
      
      setCoordinates(defaultCoords);
      console.log('[COORDINATE FALLBACK] Using default coordinates');
      
    } catch (error) {
      console.error('[COORDINATE FALLBACK] Error fetching coordinates:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Set default coordinates on error
      const defaultCoords: CoordinateData = {
        latitude: defaultCoordinates[0],
        longitude: defaultCoordinates[1],
        source: 'default',
        status: 'offline',
        gpsValid: false,
        satellites: 0,
        lastUpdate: new Date().toISOString()
      };
      
      setCoordinates(defaultCoords);
    } finally {
      setLoading(false);
    }
  }, [binId, defaultCoordinates]);

  // Auto-refresh coordinates
  useEffect(() => {
    fetchCoordinates();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchCoordinates, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCoordinates, refreshInterval]);

  // Get coordinate status for UI
  const getStatusInfo = useCallback(() => {
    switch (coordinates.status) {
      case 'live':
        return {
          color: '#10b981', // green
          text: 'Live GPS',
          opacity: 1.0,
          icon: '🟢'
        };
      case 'stale':
        return {
          color: '#f59e0b', // amber
          text: 'Stale GPS',
          opacity: 0.7,
          icon: '🟠'
        };
      case 'offline':
        return {
          color: '#6b7280', // grey
          text: 'Offline GPS',
          opacity: 0.7,
          icon: '⚫'
        };
      default:
        return {
          color: '#374151', // dark grey
          text: 'No GPS',
          opacity: 0.7,
          icon: '❌'
        };
    }
  }, [coordinates.status]);

  // Check if coordinates are valid
  const isValid = useCallback(() => {
    return coordinates.latitude !== 0 && coordinates.longitude !== 0;
  }, [coordinates.latitude, coordinates.longitude]);

  // Get time since last update
  const getTimeSinceUpdate = useCallback(() => {
    if (!coordinates.lastUpdate) return 'Unknown';
    
    const now = new Date();
    const lastUpdate = new Date(coordinates.lastUpdate);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return `${diffSeconds}s ago`;
    }
  }, [coordinates.lastUpdate]);

  return {
    coordinates,
    loading,
    error,
    refetch: fetchCoordinates,
    getStatusInfo,
    isValid,
    getTimeSinceUpdate
  };
}
