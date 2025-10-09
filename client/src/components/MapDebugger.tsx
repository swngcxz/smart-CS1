import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapDebuggerProps {
  className?: string;
}

export function MapDebugger({ className = '' }: MapDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState({
    leafletLoaded: false,
    reactLeafletLoaded: false,
    mapContainerAvailable: false,
    tileServerAccessible: false,
    gpsDataAvailable: false,
    errors: [] as string[]
  });

  useEffect(() => {
    const checkMapStatus = async () => {
      const info = {
        leafletLoaded: false,
        reactLeafletLoaded: false,
        mapContainerAvailable: false,
        tileServerAccessible: false,
        gpsDataAvailable: false,
        errors: [] as string[]
      };

      try {
        // Check if Leaflet is loaded
        if (typeof window !== 'undefined' && (window as any).L) {
          info.leafletLoaded = true;
        } else {
          info.errors.push('Leaflet library not loaded');
        }

        // Check if React-Leaflet is loaded
        try {
          const { MapContainer } = require('react-leaflet');
          if (MapContainer) {
            info.reactLeafletLoaded = true;
          }
        } catch (e) {
          info.errors.push('React-Leaflet not available');
        }

        // Check if map container element exists
        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer) {
          info.mapContainerAvailable = true;
        } else {
          info.errors.push('Map container element not found');
        }

        // Test tile server accessibility
        try {
          const response = await fetch('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/500/500', {
            method: 'HEAD',
            mode: 'no-cors'
          });
          info.tileServerAccessible = true;
        } catch (e) {
          info.errors.push('Tile server not accessible');
        }

        // Check GPS data (this would come from your real-time data)
        // For now, just check if the API endpoint is accessible
        try {
          const response = await fetch('http://localhost:8000/api/bin1');
          if (response.ok) {
            info.gpsDataAvailable = true;
          }
        } catch (e) {
          info.errors.push('GPS data API not accessible');
        }

        setDebugInfo(info);
      } catch (error) {
        info.errors.push(`Debug check failed: ${error}`);
        setDebugInfo(info);
      }
    };

    checkMapStatus();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="text-sm">Map Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2 rounded ${debugInfo.leafletLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Leaflet: {debugInfo.leafletLoaded ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${debugInfo.reactLeafletLoaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            React-Leaflet: {debugInfo.reactLeafletLoaded ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${debugInfo.mapContainerAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Container: {debugInfo.mapContainerAvailable ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${debugInfo.tileServerAccessible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Tiles: {debugInfo.tileServerAccessible ? '✓' : '✗'}
          </div>
          <div className={`p-2 rounded ${debugInfo.gpsDataAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            GPS Data: {debugInfo.gpsDataAvailable ? '✓' : '✗'}
          </div>
        </div>
        
        {debugInfo.errors.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-medium text-red-600 mb-1">Errors:</div>
            {debugInfo.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-1 rounded mb-1">
                {error}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
