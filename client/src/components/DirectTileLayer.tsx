import React, { useState, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

interface DirectTileLayerProps {
  transitionZoomLevel?: number;
  maxZoom?: number;
  minZoom?: number;
}

// Direct approach - render only one layer at a time
function DirectTileSwitcher({ 
  transitionZoomLevel = 18,
  maxZoom = 22,
  minZoom = 1
}: DirectTileLayerProps) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      console.log(`Current zoom level: ${zoom}`);
    };

    // Set initial zoom
    handleZoomEnd();

    // Listen for zoom changes
    map.on('zoomend', handleZoomEnd);

    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Determine which layer to show based on zoom level
  const showStreetMap = currentZoom >= transitionZoomLevel;

  if (showStreetMap) {
    // Google Maps street view for high zoom levels
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.google.com/">Google</a>'
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        maxZoom={maxZoom}
        minZoom={minZoom}
        opacity={1}
        zIndex={1}
        errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      />
    );
  } else {
    // Esri satellite view for low zoom levels
    return (
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={maxZoom}
        minZoom={minZoom}
        opacity={1}
        zIndex={1}
        errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
      />
    );
  }
}

export function DirectTileLayer(props: DirectTileLayerProps) {
  return <DirectTileSwitcher {...props} />;
}
