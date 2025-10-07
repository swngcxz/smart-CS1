import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface GpsBackupData {
  binId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  source: 'live' | 'backup';
  gps_valid?: boolean;
}

export interface GpsBackupStatus {
  isInitialized: boolean;
  lastBackupTime: string;
  cachedCoordinatesCount: number;
  cachedBins: string[];
}

export interface BinCoordinateStatus {
  binId: string;
  liveGPS: {
    latitude: number;
    longitude: number;
    valid: boolean;
    timestamp?: string;
  };
  backupGPS: {
    latitude: number;
    longitude: number;
    valid: boolean;
    timestamp?: string;
  };
  displaySource: 'live' | 'backup' | 'none';
}

// Get GPS backup service status
export function useGpsBackupStatus() {
  const [status, setStatus] = useState<GpsBackupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/gps-backup/status');
      setStatus(response.data.status);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch GPS backup status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { status, loading, error, refetch: fetchStatus };
}

// Get backup coordinates for a specific bin
export function useGpsBackupCoordinates(binId: string | null) {
  const [coordinates, setCoordinates] = useState<GpsBackupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoordinates = async () => {
    if (!binId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/gps-backup/backup/${binId}`);
      setCoordinates(response.data.coordinates);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || `Failed to fetch backup coordinates for ${binId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, [binId]);

  return { coordinates, loading, error, refetch: fetchCoordinates };
}

// Get display coordinates (backup if live GPS is invalid) for a specific bin
export function useDisplayCoordinates(binId: string | null) {
  const [coordinates, setCoordinates] = useState<GpsBackupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDisplayCoordinates = async () => {
    if (!binId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/gps-backup/display/${binId}`);
      setCoordinates(response.data.coordinates);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || `Failed to fetch display coordinates for ${binId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplayCoordinates();
  }, [binId]);

  return { coordinates, loading, error, refetch: fetchDisplayCoordinates };
}

// Get all bins with their coordinate status
export function useAllBinsCoordinateStatus() {
  const [binsStatus, setBinsStatus] = useState<BinCoordinateStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBinsStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/gps-backup/bins/status');
      setBinsStatus(response.data.bins);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to fetch bins coordinate status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBinsStatus();
  }, []);

  return { binsStatus, loading, error, refetch: fetchBinsStatus };
}

// Manually trigger backup for a specific bin
export function useTriggerBackup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerBackup = async (binId: string, latitude: number, longitude: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post(`/api/gps-backup/backup/${binId}`, {
        latitude,
        longitude
      });
      
      return response.data;
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to trigger backup');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { triggerBackup, loading, error };
}

// Force backup of all valid coordinates
export function useForceBackup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forceBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/gps-backup/force-backup');
      return response.data;
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to force backup');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { forceBackup, loading, error };
}

// Utility function to check if coordinates are valid
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude !== null && 
    latitude !== undefined && 
    latitude !== 0 &&
    longitude !== null && 
    longitude !== undefined && 
    longitude !== 0 &&
    !isNaN(latitude) && 
    !isNaN(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

// Utility function to calculate time difference
export function getTimeDifference(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
}
