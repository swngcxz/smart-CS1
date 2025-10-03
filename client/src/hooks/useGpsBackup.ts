import { useApiGet, useApiPost } from "./useApi";

export interface GpsBackupData {
  id: string;
  binId: string;
  lastKnownLatitude: number;
  lastKnownLongitude: number;
  lastUpdateTime: string;
  status: 'online' | 'offline';
  reason: 'gps_malfunction' | 'gps_restored';
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface BinWithGpsStatus {
  binId: string;
  isGpsMalfunctioning: boolean;
  backupData: GpsBackupData | null;
  currentCoordinates: {
    latitude: number;
    longitude: number;
  };
}

// Get all GPS backup records
export function useGpsBackups() {
  return useApiGet<GpsBackupData[]>("/api/gps-backup");
}

// Get GPS backup for specific bin
export function useGpsBackup(binId: string | null) {
  return useApiGet<GpsBackupData>(binId ? `/api/gps-backup/${binId}` : null);
}

// Save last known coordinates
export function useSaveGpsBackup() {
  return useApiPost("/api/gps-backup/save");
}

// Update GPS status
export function useUpdateGpsStatus() {
  return useApiPost("/api/gps-backup");
}

// Check multiple bins GPS status
export function useCheckMultipleBinsGpsStatus() {
  return useApiPost("/api/gps-backup/check-multiple");
}

// Utility function to check if coordinates indicate GPS malfunction
export function isGpsMalfunctioning(latitude: number, longitude: number): boolean {
  return (
    (latitude === 0 && longitude === 0) ||
    latitude === null || longitude === null ||
    latitude === undefined || longitude === undefined ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
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

