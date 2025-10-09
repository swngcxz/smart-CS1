import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface SimpleMapFallbackProps {
  onRetry?: () => void;
  error?: Error;
  gpsStatus?: {
    gps_valid: boolean;
    latitude: number;
    longitude: number;
    coordinates_source?: string;
    satellites?: number;
  };
}

export function SimpleMapFallback({ onRetry, error, gpsStatus }: SimpleMapFallbackProps) {
  const isGPSValid = gpsStatus?.gps_valid || gpsStatus?.coordinates_source === 'gps_backup';
  const hasCoordinates = gpsStatus?.latitude && gpsStatus?.longitude && 
                        gpsStatus.latitude !== 0 && gpsStatus.longitude !== 0;

  return (
    <Card className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <CardContent className="text-center p-8 max-w-md">
        <div className="mb-4">
          {error?.message?.includes('network') || error?.message?.includes('fetch') ? (
            <WifiOff className="w-16 h-16 mx-auto text-red-500 mb-4" />
          ) : (
            <MapPin className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Map Loading Error
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error?.message?.includes('network') || error?.message?.includes('fetch') 
            ? "Unable to load map tiles. Please check your internet connection and try again."
            : error?.message?.includes('Leaflet') || error?.message?.includes('MapContainer')
            ? "Map library loading issue. Please refresh the page or check your browser console."
            : "There was an issue loading the map. This might be due to tile server limitations or network issues."}
        </p>
        
        {error?.message && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Error:</strong> {error.message}
            </p>
          </div>
        )}

        {/* GPS Status Display */}
        {gpsStatus && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {isGPSValid ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-500" />
              )}
              <span className={`text-sm font-medium ${
                isGPSValid ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                GPS: {isGPSValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            
            {hasCoordinates && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div>Coordinates: {gpsStatus.latitude.toFixed(6)}, {gpsStatus.longitude.toFixed(6)}</div>
                <div>Source: {gpsStatus.coordinates_source || 'Unknown'}</div>
                {gpsStatus.satellites !== undefined && (
                  <div>Satellites: {gpsStatus.satellites}</div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Loading Map
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
