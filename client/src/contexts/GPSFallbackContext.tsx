import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Global GPS Fallback Context for Web Dashboard
 * 
 * This context provides GPS fallback functionality for the web dashboard.
 * It stores the last known GPS coordinates in localStorage when GPS is valid 
 * and provides fallback coordinates when GPS is invalid (indoor, device off, etc.).
 * 
 * Features:
 * - Automatic storage of last known GPS coordinates in localStorage
 * - Fallback coordinates when GPS is invalid
 * - Time tracking since last GPS connection
 * - Cross-browser compatibility
 * - Real-time data integration
 */

interface GPSData {
  latitude: number;
  longitude: number;
  gps_valid: boolean;
  satellites: number;
  timestamp: number;
}

interface LastKnownGPS {
  latitude: number;
  longitude: number;
  timestamp: number;
  satellites: number;
}

interface GPSFallbackContextType {
  // Get coordinates (valid GPS or fallback)
  getFallbackCoordinates: (gpsData?: GPSData) => {
    latitude: number;
    longitude: number;
    isOffline: boolean;
    timeSinceLastGPS: string;
    satellites: number;
    lastKnownTimestamp: number;
  } | null;
  
  // Update GPS data and store if valid
  updateGPSData: (gpsData: GPSData) => void;
  
  // Get time since last GPS connection
  getTimeSinceLastGPS: (timestamp?: number) => string;
  
  // Get last known GPS data
  getLastKnownGPS: () => LastKnownGPS | null;
  
  // Check if coordinates are valid (not zero/null)
  isValidCoordinates: (lat: number, lng: number) => boolean;
  
  // Force update last known GPS (for manual updates)
  forceUpdateLastKnownGPS: (latitude: number, longitude: number, satellites?: number) => void;
}

const GPSFallbackContext = createContext<GPSFallbackContextType | undefined>(undefined);

interface GPSFallbackProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'gps_fallback_last_known';

export function GPSFallbackProvider({ children }: GPSFallbackProviderProps) {
  const [lastKnownGPS, setLastKnownGPS] = useState<LastKnownGPS | null>(null);

  // Load last known GPS from localStorage on mount
  useEffect(() => {
    loadLastKnownGPS();
  }, []);

  const loadLastKnownGPS = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLastKnownGPS(parsed);
        console.log('🛰️ GPS Fallback (Web) - Loaded last known GPS:', parsed);
      }
    } catch (error) {
      console.error('🛰️ GPS Fallback (Web) - Error loading last known GPS:', error);
    }
  };

  const saveLastKnownGPS = (gpsData: LastKnownGPS) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gpsData));
      console.log('🛰️ GPS Fallback (Web) - Saved last known GPS:', gpsData);
    } catch (error) {
      console.error('🛰️ GPS Fallback (Web) - Error saving last known GPS:', error);
    }
  };

  const isValidCoordinates = (lat: number, lng: number): boolean => {
    return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  const getTimeSinceLastGPS = (timestamp?: number): string => {
    const targetTimestamp = timestamp || lastKnownGPS?.timestamp;
    if (!targetTimestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - targetTimestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const updateGPSData = (gpsData: GPSData) => {
    // Only update if GPS is valid and coordinates are valid
    if (gpsData.gps_valid && isValidCoordinates(gpsData.latitude, gpsData.longitude)) {
      const newLastKnownGPS: LastKnownGPS = {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        timestamp: gpsData.timestamp,
        satellites: gpsData.satellites
      };
      
      setLastKnownGPS(newLastKnownGPS);
      saveLastKnownGPS(newLastKnownGPS);
      
      console.log('🛰️ GPS Fallback (Web) - Updated last known GPS:', {
        lat: gpsData.latitude,
        lng: gpsData.longitude,
        satellites: gpsData.satellites,
        timeSince: getTimeSinceLastGPS(gpsData.timestamp)
      });
    }
  };

  const forceUpdateLastKnownGPS = (latitude: number, longitude: number, satellites: number = 0) => {
    if (isValidCoordinates(latitude, longitude)) {
      const newLastKnownGPS: LastKnownGPS = {
        latitude,
        longitude,
        timestamp: Date.now(),
        satellites
      };
      
      setLastKnownGPS(newLastKnownGPS);
      saveLastKnownGPS(newLastKnownGPS);
      
      console.log('🛰️ GPS Fallback (Web) - Force updated last known GPS:', newLastKnownGPS);
    }
  };

  const getFallbackCoordinates = (gpsData?: GPSData) => {
    // Check if current GPS data is valid
    if (gpsData?.gps_valid && isValidCoordinates(gpsData.latitude, gpsData.longitude)) {
      // Update last known GPS with current valid data
      updateGPSData(gpsData);
      
      return {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        isOffline: false,
        timeSinceLastGPS: getTimeSinceLastGPS(gpsData.timestamp),
        satellites: gpsData.satellites,
        lastKnownTimestamp: gpsData.timestamp
      };
    }
    
    // Use fallback coordinates if available
    if (lastKnownGPS && isValidCoordinates(lastKnownGPS.latitude, lastKnownGPS.longitude)) {
      return {
        latitude: lastKnownGPS.latitude,
        longitude: lastKnownGPS.longitude,
        isOffline: true,
        timeSinceLastGPS: getTimeSinceLastGPS(lastKnownGPS.timestamp),
        satellites: lastKnownGPS.satellites,
        lastKnownTimestamp: lastKnownGPS.timestamp
      };
    }
    
    // Only return default coordinates if no GPS data is available at all
    // Don't show marker if GPS is invalid and no last known location
    if (!gpsData || (!gpsData.gps_valid && !lastKnownGPS)) {
      console.log('🛰️ GPS Fallback (Web) - No GPS data available, hiding marker');
      return null;
    }
    
    // Default fallback coordinates (Central Plaza area) - only if we have some GPS data but it's invalid
    const defaultCoordinates = {
      latitude: 10.2445, // Updated to match Central Plaza coordinates
      longitude: 123.7666,
      isOffline: true,
      timeSinceLastGPS: 'Never',
      satellites: 0,
      lastKnownTimestamp: 0
    };
    
    console.log('🛰️ GPS Fallback (Web) - Using default coordinates for invalid GPS');
    return defaultCoordinates;
  };

  const getLastKnownGPS = () => lastKnownGPS;

  return (
    <GPSFallbackContext.Provider
      value={{
        getFallbackCoordinates,
        updateGPSData,
        getTimeSinceLastGPS,
        getLastKnownGPS,
        isValidCoordinates,
        forceUpdateLastKnownGPS,
      }}
    >
      {children}
    </GPSFallbackContext.Provider>
  );
}

export function useGPSFallback() {
  const context = useContext(GPSFallbackContext);
  if (context === undefined) {
    throw new Error('useGPSFallback must be used within a GPSFallbackProvider');
  }
  return context;
}