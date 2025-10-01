import React, { useState } from 'react';
import { useGPSFallback } from '@/hooks/useGPSFallback';

interface GPSFallbackIndicatorProps {
  binId?: string;
  className?: string;
  currentGPSStatus?: {
    gps_valid: boolean;
    latitude: number;
    longitude: number;
    coordinates_source?: string;
    satellites?: number;
    last_active?: string;
    gps_timestamp?: string;
  };
}

// Helper function to calculate time ago
const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const lastUpdate = new Date(timestamp);
  const diffInMs = now.getTime() - lastUpdate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

export function GPSFallbackIndicator({ binId, className = '', currentGPSStatus }: GPSFallbackIndicatorProps) {
  const { status, coordinates, loading, error } = useGPSFallback();

  if (loading) {
    return (
      <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span className="text-xs text-blue-600 dark:text-blue-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-red-500 text-xs">⚠️</span>
          <span className="text-xs text-red-600 dark:text-red-400">GPS Error</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const binCoordinates = binId ? coordinates[binId] : null;
  const binName = binId === 'bin1' ? 'Central Plaza' : binId || 'Unknown Bin';
  
  // Determine online status based on current GPS data
  const isCurrentlyOnline = currentGPSStatus ? 
    (currentGPSStatus.coordinates_source === 'gps_live' && currentGPSStatus.satellites > 0) : 
    false;
  
  const hasCachedCoordinates = currentGPSStatus ? 
    (currentGPSStatus.coordinates_source === 'gps_live' || currentGPSStatus.coordinates_source === 'gps_cached') : 
    false;
  
  const lastOnlineTime = currentGPSStatus?.last_active || (binCoordinates ? getTimeAgo(binCoordinates.lastUpdated) : 'Never');

  return (
    <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-green-500 text-sm">🛰️</span>
        <div className="flex-1">
          <div className="text-xs font-medium text-green-700 dark:text-green-300">
            {binName}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            {isCurrentlyOnline ? (
              <>
                <span className="text-green-600">●</span> Online • Live GPS
              </>
            ) : hasCachedCoordinates ? (
              <>
                <span className="text-orange-500">●</span> Offline • Cached
              </>
            ) : (
              <>
                <span className="text-red-500">●</span> Offline • No cache
              </>
            )}
          </div>
          {hasCachedCoordinates && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last online: {lastOnlineTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
