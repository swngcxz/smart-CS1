import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Satellite, MapPin } from 'lucide-react';

interface MapTypeIndicatorProps {
  transitionZoomLevel?: number;
  className?: string;
}

export function MapTypeIndicator({ 
  transitionZoomLevel = 19, 
  className = "map-type-indicator" 
}: MapTypeIndicatorProps) {
  const map = useMap();
  const [currentType, setCurrentType] = useState<'satellite' | 'street'>('satellite');
  const [zoomLevel, setZoomLevel] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom);
      
      if (currentZoom >= transitionZoomLevel) {
        setCurrentType('street');
      } else {
        setCurrentType('satellite');
      }
    };

    // Set initial state
    handleZoomEnd();

    // Listen for zoom changes
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, transitionZoomLevel]);

  return (
    <div className={`${className} ${currentType}`}>
      <div className="flex items-center gap-2">
        {currentType === 'satellite' ? (
          <>
            <Satellite className="w-4 h-4" />
            <span>Satellite View</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            <span>Street Map</span>
          </>
        )}
        <span className="text-xs opacity-75">(Zoom: {zoomLevel})</span>
      </div>
    </div>
  );
}
