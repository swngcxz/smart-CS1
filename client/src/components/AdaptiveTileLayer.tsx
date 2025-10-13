import React, { useState, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

interface AdaptiveTileLayerProps {
  satelliteUrl: string;
  streetUrl: string;
  satelliteAttribution: string;
  streetAttribution: string;
  transitionZoomLevel?: number;
  maxZoom?: number;
  minZoom?: number;
}

// Component to handle zoom-based tile switching
function ZoomBasedTileSwitcher({ 
  satelliteUrl, 
  streetUrl, 
  satelliteAttribution, 
  streetAttribution,
  transitionZoomLevel = 19,
  maxZoom = 22,
  minZoom = 1
}: AdaptiveTileLayerProps) {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<'satellite' | 'street'>('satellite');
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      
      if (currentZoom >= transitionZoomLevel) {
        // Switch to street map for close-up views
        if (currentLayer !== 'street') {
          setCurrentLayer('street');
          console.log(`Switching to street map at zoom level ${currentZoom}`);
        }
      } else {
        // Switch to satellite for overview
        if (currentLayer !== 'satellite') {
          setCurrentLayer('satellite');
          console.log(`Switching to satellite view at zoom level ${currentZoom}`);
        }
      }
    };

    // Listen for zoom changes
    map.on('zoomend', handleZoomEnd);
    
    // Set initial layer based on current zoom
    handleZoomEnd();

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, transitionZoomLevel, currentLayer]);

  // Smooth opacity transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentLayer]);

  return (
    <>
      {/* Satellite Layer */}
      <TileLayer
        attribution={satelliteAttribution}
        url={satelliteUrl}
        maxZoom={maxZoom}
        minZoom={minZoom}
        opacity={currentLayer === 'satellite' ? opacity : 0}
        zIndex={currentLayer === 'satellite' ? 1 : 0}
        className={currentLayer === 'satellite' ? 'satellite-layer' : 'satellite-layer-hidden'}
      />
      
      {/* Street Layer */}
      <TileLayer
        attribution={streetAttribution}
        url={streetUrl}
        maxZoom={maxZoom}
        minZoom={minZoom}
        opacity={currentLayer === 'street' ? opacity : 0}
        zIndex={currentLayer === 'street' ? 1 : 0}
        className={currentLayer === 'street' ? 'street-layer' : 'street-layer-hidden'}
      />
    </>
  );
}

export function AdaptiveTileLayer(props: AdaptiveTileLayerProps) {
  return <ZoomBasedTileSwitcher {...props} />;
}

// Predefined configurations
export const ADAPTIVE_TILE_CONFIGS = {
  esriHybrid: {
    satelliteUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streetUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    satelliteAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    streetAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    transitionZoomLevel: 19
  },
  googleHybrid: {
    satelliteUrl: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    streetUrl: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satelliteAttribution: '&copy; <a href="https://www.google.com/">Google</a>',
    streetAttribution: '&copy; <a href="https://www.google.com/">Google</a>',
    transitionZoomLevel: 18
  },
  osmHybrid: {
    satelliteUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streetUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satelliteAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    streetAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    transitionZoomLevel: 19
  },
  // Enhanced configuration with better high-zoom coverage
  enhancedHybrid: {
    satelliteUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streetUrl: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satelliteAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    streetAttribution: '&copy; <a href="https://www.google.com/">Google</a>',
    transitionZoomLevel: 18
  }
};
