import React, { useState, useEffect } from 'react';
import { TileLayer } from 'react-leaflet';

interface RobustTileLayerProps {
  primaryUrl: string;
  fallbackUrls: string[];
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
  opacity?: number;
  zIndex?: number;
}

export function RobustTileLayer({ 
  primaryUrl, 
  fallbackUrls, 
  attribution, 
  maxZoom = 22,
  minZoom = 1,
  opacity = 1,
  zIndex = 0
}: RobustTileLayerProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const allUrls = [primaryUrl, ...fallbackUrls];
  const currentUrl = allUrls[currentUrlIndex];

  useEffect(() => {
    // Reset error state when URL changes
    setHasError(false);
    setIsLoading(true);
  }, [currentUrlIndex]);

  const handleTileError = () => {
    console.warn(`Tile layer failed for URL: ${currentUrl}`);
    setHasError(true);
    
    // Try next fallback URL
    if (currentUrlIndex < allUrls.length - 1) {
      console.log(`Switching to fallback tile layer: ${allUrls[currentUrlIndex + 1]}`);
      setCurrentUrlIndex(currentUrlIndex + 1);
    } else {
      console.error('All tile layers have failed');
    }
  };

  const handleTileLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <TileLayer
      attribution={attribution}
      url={currentUrl}
      maxZoom={maxZoom}
      minZoom={minZoom}
      opacity={opacity}
      zIndex={zIndex}
      onTileError={handleTileError}
      onTileLoad={handleTileLoad}
      errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    />
  );
}

// Predefined tile layer configurations
export const TILE_LAYERS = {
  esriImagery: {
    primaryUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    fallbackUrls: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    ],
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
  },
  openStreetMap: {
    primaryUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    fallbackUrls: [
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
    ],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  cartoDB: {
    primaryUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    fallbackUrls: [
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
    ],
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  }
};
