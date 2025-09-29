import L from 'leaflet';

// Custom map configuration for better zoom handling
export const MAP_CONFIG = {
  // Default center for Cebu, Philippines
  defaultCenter: [10.3157, 123.8854] as [number, number],
  
  // Zoom configuration
  zoom: {
    default: 18,
    min: 10,
    max: 22,
    // High zoom levels that might cause issues
    problematicZoomLevels: [21, 22]
  },
  
  // Bounds for Cebu area
  bounds: {
    north: 11.3,
    south: 9.8,
    east: 124.1,
    west: 123.5
  },
  
  // Tile layer configurations with fallbacks
  tileLayers: {
    primary: {
      name: 'Esri World Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 22,
      minZoom: 1
    },
    fallback1: {
      name: 'Esri World Street Map',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 20,
      minZoom: 1
    },
    fallback2: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 1
    },
    fallback3: {
      name: 'CartoDB Positron',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20,
      minZoom: 1
    }
  }
};

// Custom map options
export const MAP_OPTIONS = {
  scrollWheelZoom: true,
  zoomControl: true,
  doubleClickZoom: true,
  touchZoom: true,
  boxZoom: true,
  keyboard: true,
  maxBounds: [
    [MAP_CONFIG.bounds.south, MAP_CONFIG.bounds.west],
    [MAP_CONFIG.bounds.north, MAP_CONFIG.bounds.east]
  ],
  maxBoundsViscosity: 0.5,
  // Prevent zooming to problematic levels
  zoomSnap: 1,
  zoomDelta: 1
};

// Function to check if zoom level is problematic
export const isProblematicZoomLevel = (zoom: number): boolean => {
  return MAP_CONFIG.zoom.problematicZoomLevels.includes(zoom);
};

// Function to get safe zoom level
export const getSafeZoomLevel = (zoom: number): number => {
  if (isProblematicZoomLevel(zoom)) {
    return Math.max(zoom - 1, MAP_CONFIG.zoom.min);
  }
  return Math.min(Math.max(zoom, MAP_CONFIG.zoom.min), MAP_CONFIG.zoom.max);
};

// Custom zoom control that prevents problematic zoom levels
export const createCustomZoomControl = () => {
  const zoomControl = L.control.zoom({
    position: 'topright',
    zoomInText: '+',
    zoomOutText: '-',
    zoomInTitle: 'Zoom in',
    zoomOutTitle: 'Zoom out'
  });

  // Override zoom methods to prevent problematic levels
  const originalZoomIn = zoomControl._zoomIn;
  const originalZoomOut = zoomControl._zoomOut;

  zoomControl._zoomIn = function(e: Event) {
    e.preventDefault();
    const map = this._map;
    if (map) {
      const currentZoom = map.getZoom();
      const newZoom = getSafeZoomLevel(currentZoom + 1);
      if (newZoom !== currentZoom) {
        map.setZoom(newZoom);
      }
    }
  };

  zoomControl._zoomOut = function(e: Event) {
    e.preventDefault();
    const map = this._map;
    if (map) {
      const currentZoom = map.getZoom();
      const newZoom = getSafeZoomLevel(currentZoom - 1);
      if (newZoom !== currentZoom) {
        map.setZoom(newZoom);
      }
    }
  };

  return zoomControl;
};
