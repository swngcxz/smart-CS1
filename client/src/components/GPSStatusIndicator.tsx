import React from 'react';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getTimeAgo } from '@/utils/timeUtils';

interface GPSStatusIndicatorProps {
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
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}


export function GPSStatusIndicator({ 
  binId = 'bin1', 
  className = '', 
  currentGPSStatus,
  position = 'bottom-left'
}: GPSStatusIndicatorProps) {
  
  // Determine GPS status - be more lenient with backup coordinates
  const isGPSLive = currentGPSStatus?.gps_valid && 
                   currentGPSStatus?.satellites && 
                   currentGPSStatus.satellites > 0 &&
                   currentGPSStatus?.coordinates_source === 'gps_live';
  
  const isUsingBackup = currentGPSStatus?.coordinates_source === 'gps_backup';
  const hasValidCoordinates = currentGPSStatus?.latitude && currentGPSStatus?.longitude &&
                             currentGPSStatus.latitude !== 0 && currentGPSStatus.longitude !== 0;
  
  // Consider backup coordinates as "valid" for display purposes
  const isGPSValid = isGPSLive || (isUsingBackup && hasValidCoordinates);
  
  const binName = binId === 'bin1' ? 'Central Plaza' : binId || 'Unknown Bin';
  const lastUpdateTime = currentGPSStatus?.last_active || 
                        (currentGPSStatus?.gps_timestamp ? getTimeAgo(currentGPSStatus.gps_timestamp).text : 'Never');

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-[1000] max-w-sm ${className}`}>
      <div className={`
        rounded-lg p-3 border transition-all duration-300
        ${isGPSValid 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
        }
      `}>
        {/* Header with icon and status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {/* GPS Icon with animation */}
            <div className="relative">
              <MapPin className={`h-4 w-4 ${isGPSValid ? 'text-green-600' : 'text-gray-500'}`} />
              {isGPSValid && (
                <div className="absolute inset-0">
                  <div className="animate-ping">
                    <MapPin className="h-4 w-4 text-green-600 opacity-75" />
                  </div>
                </div>
              )}
            </div>
            
            <span className={`text-sm font-medium ${
              isGPSValid ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {binName}
            </span>
          </div>
          
          {/* Status Badge */}
          <Badge 
            variant="secondary" 
            className={`
              ${isGPSValid 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
              }
            `}
          >
            {isGPSLive ? 'LIVE' : isUsingBackup ? 'BACKUP' : 'OFFLINE'}
          </Badge>
        </div>

        {/* GPS Details */}
        <div className="space-y-1">
          {/* Connection Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">GPS Status:</span>
            <div className="flex items-center space-x-1">
              {isGPSLive ? (
                <>
                  <span className="text-green-600 font-medium">Connected</span>
                </>
              ) : isUsingBackup ? (
                <>
                  <span className="text-orange-600 font-medium">Backup Mode</span>
                </>
              ) : (
                <>
                  <span className="text-gray-500 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>

          {/* Coordinates Source */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Source:</span>
            <span className={`font-medium ${
              isGPSLive ? 'text-green-600' : 
              isUsingBackup ? 'text-orange-600' : 'text-gray-500'
            }`}>
              {isGPSLive ? 'Live GPS' : 
               isUsingBackup ? 'Backup GPS' : 'No Data'}
            </span>
          </div>

          {/* Satellites */}
          {currentGPSStatus?.satellites !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Satellites:</span>
              <span className={`font-medium ${
                isGPSValid ? 'text-green-600' : 'text-gray-500'
              }`}>
                {currentGPSStatus.satellites}
              </span>
            </div>
          )}

          {/* Last Update */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
            <span className={`font-medium ${
              isGPSValid ? 'text-green-600' : 'text-gray-500'
            }`}>
              {lastUpdateTime}
            </span>
          </div>

          {/* Coordinates */}
          {hasValidCoordinates && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
              <span className={`font-mono text-xs ${
                isGPSValid ? 'text-green-600' : 'text-gray-500'
              }`}>
                {currentGPSStatus.latitude.toFixed(6)}, {currentGPSStatus.longitude.toFixed(6)}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicator Bar */}
        <div className="mt-2 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              isGPSValid 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-gray-400'
            }`}
            style={{ width: isGPSValid ? '100%' : '30%' }}
          />
        </div>
      </div>
    </div>
  );
}
