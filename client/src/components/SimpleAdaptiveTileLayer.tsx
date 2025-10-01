import React, { useState, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

interface SimpleAdaptiveTileLayerProps {
  satelliteUrl: string;
  streetUrl: string;
  satelliteAttribution: string;
  streetAttribution: string;
  transitionZoomLevel?: number;
  maxZoom?: number;
  minZoom?: number;
}

// Simple component that renders only one tile layer at a time
function SimpleAdaptiveTileSwitcher({ 
  satelliteUrl, 
  streetUrl, 
  satelliteAttribution, 
  streetAttribution,
  transitionZoomLevel = 18,
  maxZoom = 22,
  minZoom = 1
}: SimpleAdaptiveTileLayerProps) {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<'satellite' | 'street'>('satellite');

  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      
      if (currentZoom >= transitionZoomLevel) {
        // Switch to street map for close-up views
        if (currentLayer !== 'street') {
          console.log(`🗺️ Switching to street map at zoom level ${currentZoom}`);
          setCurrentLayer('street');
        }
      } else {
        // Switch to satellite for overview
        if (currentLayer !== 'satellite') {
          console.log(`🛰️ Switching to satellite view at zoom level ${currentZoom}`);
          setCurrentLayer('satellite');
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

  // Render only the active layer
  if (currentLayer === 'satellite') {
    return (
      <TileLayer
        attribution={satelliteAttribution}
        url={satelliteUrl}
        maxZoom={maxZoom}
        minZoom={minZoom}
        opacity={1}
        zIndex={1}
      />
    );
  } else {
    return (
      <TileLayer
        attribution={streetAttribution}
        url={streetUrl}
        maxZoom={maxZoom}
        minZoom={minZoom}
        opacity={1}
        zIndex={1}
      />
    );
  }
}

export function SimpleAdaptiveTileLayer(props: SimpleAdaptiveTileLayerProps) {
  return <SimpleAdaptiveTileSwitcher {...props} />;
}

// Enhanced configurations with better reliability
export const SIMPLE_TILE_CONFIGS = {
  // Esri satellite + Google street (most reliable)
  esriGoogleHybrid: {
    satelliteUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streetUrl: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satelliteAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    streetAttribution: '&copy; <a href="https://www.google.com/">Google</a>',
    transitionZoomLevel: 18
  },
  // Esri satellite + Esri street
  esriHybrid: {
    satelliteUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streetUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    satelliteAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    streetAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    transitionZoomLevel: 18
  },
  // OpenStreetMap as fallback
  osmHybrid: {
    satelliteUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    streetUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satelliteAttribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    streetAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    transitionZoomLevel: 18
  }
};
