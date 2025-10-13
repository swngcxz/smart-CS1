import React, { useState, useEffect } from 'react';
import { TileLayer, useMap } from 'react-leaflet';

interface RobustAdaptiveTileLayerProps {
  transitionZoomLevel?: number;
  maxZoom?: number;
  minZoom?: number;
}

// Robust component with multiple fallback providers
function RobustAdaptiveTileSwitcher({ 
  transitionZoomLevel = 18,
  maxZoom = 22,
  minZoom = 1
}: RobustAdaptiveTileLayerProps) {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<'satellite' | 'street'>('satellite');
  const [currentProvider, setCurrentProvider] = useState(0);

  // Multiple providers for each layer type
  const satelliteProviders = [
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      name: 'Esri Satellite'
    },
    {
      url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: '&copy; <a href="https://www.google.com/">Google</a>',
      name: 'Google Satellite'
    }
  ];

  const streetProviders = [
    {
      url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: '&copy; <a href="https://www.google.com/">Google</a>',
      name: 'Google Street'
    },
    {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      name: 'Esri Street'
    },
    {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      name: 'OpenStreetMap'
    }
  ];

  useEffect(() => {
    const handleZoomEnd = () => {
      const currentZoom = map.getZoom();
      
      if (currentZoom >= transitionZoomLevel) {
        // Switch to street map for close-up views
        if (currentLayer !== 'street') {
          console.log(`Switching to street map at zoom level ${currentZoom}`);
          setCurrentLayer('street');
          setCurrentProvider(0); // Reset to first street provider
        }
      } else {
        // Switch to satellite for overview
        if (currentLayer !== 'satellite') {
          console.log(`Switching to satellite view at zoom level ${currentZoom}`);
          setCurrentLayer('satellite');
          setCurrentProvider(0); // Reset to first satellite provider
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

  const handleTileError = () => {
    console.warn(`Tile provider failed, trying next one...`);
    
    if (currentLayer === 'satellite') {
      if (currentProvider < satelliteProviders.length - 1) {
        setCurrentProvider(currentProvider + 1);
        console.log(`Switching to satellite provider: ${satelliteProviders[currentProvider + 1].name}`);
      }
    } else {
      if (currentProvider < streetProviders.length - 1) {
        setCurrentProvider(currentProvider + 1);
        console.log(`Switching to street provider: ${streetProviders[currentProvider + 1].name}`);
      }
    }
  };

  // Get current provider
  const providers = currentLayer === 'satellite' ? satelliteProviders : streetProviders;
  const provider = providers[currentProvider];

  return (
    <TileLayer
      attribution={provider.attribution}
      url={provider.url}
      maxZoom={maxZoom}
      minZoom={minZoom}
      opacity={1}
      zIndex={1}
      onTileError={handleTileError}
      errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    />
  );
}

export function RobustAdaptiveTileLayer(props: RobustAdaptiveTileLayerProps) {
  return <RobustAdaptiveTileSwitcher {...props} />;
}
