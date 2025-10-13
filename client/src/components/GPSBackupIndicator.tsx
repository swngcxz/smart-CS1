import React from 'react';
import { useGpsBackupStatus } from '@/hooks/useGpsBackup';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Database } from 'lucide-react';

interface GPSBackupIndicatorProps {
  className?: string;
}

export function GPSBackupIndicator({ className = '' }: GPSBackupIndicatorProps) {
  const { status, loading, error } = useGpsBackupStatus();

  if (loading) {
    return (
      <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600 dark:text-blue-400">Loading GPS Backup...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-red-600 dark:text-red-400">GPS Backup Error</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const getLastBackupTime = () => {
    if (!status.lastBackupTime) return 'Never';
    
    const now = new Date();
    const lastBackup = new Date(status.lastBackupTime);
    const diffMs = now.getTime() - lastBackup.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            GPS Backup System
          </span>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Active
        </Badge>
      </div>
      
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Cached Bins:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {status.cachedCoordinatesCount}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Last Backup:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {getLastBackupTime()}
          </span>
        </div>
        
        {status.cachedBins.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">Bins:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {status.cachedBins.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
