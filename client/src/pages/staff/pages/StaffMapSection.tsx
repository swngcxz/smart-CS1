import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { DynamicBinMarker } from "./DynamicBinMarker";
import { GPSTrackingLine } from "./GPSTrackingLine";
import { DirectTileLayer } from "@/components/DirectTileLayer";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { MapTypeIndicator } from "@/components/MapTypeIndicator";
import { GPSStatusIndicator } from "@/components/GPSStatusIndicator";
import { MAP_CONFIG, MAP_OPTIONS, getSafeZoomLevel } from "@/components/MapConfig";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import "@/styles/map-transitions.css";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { MapPin, Wifi, WifiOff, ChevronDown, ChevronUp, Plus, Search, Filter } from "lucide-react";
import { getActiveTimeAgo } from "@/utils/timeUtils";
import { getDistanceFromMap } from "@/utils/distanceUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AddBinModal } from "@/components/modals/AddBinModal";

// Optimized styles - only inject once
const userLocationStyles = `
  .user-location-marker {
    background: transparent !important;
    border: none !important;
  }
  .user-location-marker .animate-ping {
    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  .map-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #f8fafc;
  }
  .map-loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #10b981;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .leaflet-container {
    border-radius: 0 0 12px 12px;
  }
  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    border-radius: 12px !important;
    overflow: hidden;
  }
  .leaflet-control-zoom a {
    background: white !important;
    border: none !important;
    color: #374151 !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
  }
  .leaflet-control-zoom a:hover {
    background: #f3f4f6 !important;
    color: #10b981 !important;
  }
  .leaflet-tile-container {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  .leaflet-tile {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  .leaflet-container {
    background: #f8f9fa !important;
  }
  .leaflet-tile-pane {
    opacity: 1 !important;
  }
`;

// Inject styles only once
if (typeof document !== "undefined" && !document.getElementById("map-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "map-styles";
  styleSheet.type = "text/css";
  styleSheet.innerText = userLocationStyles;
  document.head.appendChild(styleSheet);
}

// Optimized marker icon configuration - only set once
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// User location icon creation function
const createUserLocationIcon = () => {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div class="relative">
        <div class="absolute inset-0 w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        <div class="relative w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Default center coordinates (fallback) - will be overridden by real-time data
const defaultCenter: LatLngTuple = [10.2105, 123.7583];

function MapInitializer({ setMapRef }: { setMapRef: (map: any) => void }) {
  const map = useMap();
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  return null;
}

interface StaffMapSectionProps {
  onBinClick?: (binId: string) => void;
  showRightPanel?: boolean;
  isPanelOpen?: boolean;
  rightPanel?: React.ReactNode;
}

export function StaffMapSection({ onBinClick, showRightPanel, isPanelOpen, rightPanel }: StaffMapSectionProps) {
  const { wasteBins, loading, error, bin1Data, monitoringData, gpsHistory, dynamicBinLocations } = useRealTimeData();
  const [showGPSTracking, setShowGPSTracking] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isAddBinModalOpen, setIsAddBinModalOpen] = useState(false);
  

  // Memoized handlers to prevent unnecessary re-renders
  const handleBinClick = useCallback((binId: string) => {
    if (onBinClick) onBinClick(binId);
  }, [onBinClick]);

  const handleRouteSelect = useCallback((route: string) => {
    setSelectedRoute(route);
    toast.success(`${route.charAt(0).toUpperCase() + route.slice(1).replace("-", " ")} route selected`);
  }, []);

  const toggleLocationDropdown = useCallback(() => {
    setIsLocationDropdownOpen(!isLocationDropdownOpen);
  }, [isLocationDropdownOpen]);

  const handleBinRegistered = useCallback((binId: string) => {
    console.log(`Bin ${binId} registered successfully for monitoring!`);
    toast.success(`Bin ${binId} is now being monitored!`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("binRegistered", { detail: { binId } }));
    }, 1000);
  }, []);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // New state that indicates the Leaflet map instance is ready
  const [mapLoaded, setMapLoaded] = useState(false);

  // Memoized bin locations processing for better performance
  const updatedBinLocations = useMemo(() => {
    if (dynamicBinLocations.length === 0) return [];
    
    return dynamicBinLocations.map((bin) => ({
      id: bin.id,
      name: bin.name,
      position: [bin.position[0], bin.position[1]] as [number, number],
      level: bin.level,
      status: bin.status as "normal" | "warning" | "critical",
      lastCollection: bin.lastCollection,
      route: bin.route,
      gps_valid: bin.gps_valid,
      satellites: bin.satellites,
      timestamp: bin.timestamp,
      weight_kg: bin.weight_kg,
      distance_cm: bin.distance_cm,
      last_active: bin.last_active,
      gps_timestamp: bin.gps_timestamp,
      backup_timestamp: bin.backup_timestamp,
      coordinates_source: bin.coordinates_source,
    }));
  }, [dynamicBinLocations]);

  // Memoized map center calculation
  const mapCenter = useMemo(() => {
    // Priority: bin1 GPS > first bin location > default
    if (bin1Data?.gps_valid && bin1Data.latitude && bin1Data.longitude) {
      return [bin1Data.latitude, bin1Data.longitude] as LatLngTuple;
    }
    if (updatedBinLocations.length > 0) {
      return updatedBinLocations[0].position;
    }
    return defaultCenter;
  }, [bin1Data, updatedBinLocations]);

  // Debug logging for real-time data (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (bin1Data) {
        console.log("🗺️ Staff Map - Real-time bin1 data received:", bin1Data);
      }
      if (updatedBinLocations.length > 0) {
        console.log("🗺️ Staff Map - Updated bin locations:", updatedBinLocations.length);
      }
    }
  }, [bin1Data, updatedBinLocations]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Refs for our custom tile layers
  const baseLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);

  // Enhanced tile layer configuration for consistent detail at all zoom levels
  const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ESRI_SAT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const CARTODB_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const SAT_TRANSITION_ZOOM = 15; // Switch to satellite at zoom 15

  // Memoized tile layer options for better performance and coverage
  const tileLayerOptions = useMemo(() => ({
    base: {
      url: OSM_URL,
      maxZoom: 20,
      minZoom: 1,
      detectRetina: true,
      attribution: "&copy; OpenStreetMap contributors",
      subdomains: ['a', 'b', 'c'],
      tileSize: 256,
      zoomOffset: 0
    },
    satellite: {
      url: ESRI_SAT_URL,
      maxNativeZoom: 20,
      maxZoom: 22,
      minZoom: 1,
      opacity: 0,
      zIndex: 15,
      detectRetina: true,
      attribution: "Tiles &copy; Esri",
      subdomains: ['server'],
      tileSize: 256,
      zoomOffset: 0
    },
    fallback: {
      url: CARTODB_URL,
      maxZoom: 20,
      minZoom: 1,
      detectRetina: true,
      attribution: "&copy; CARTO",
      subdomains: ['a', 'b', 'c', 'd'],
      tileSize: 256,
      zoomOffset: 0
    }
  }), []);

  // Optimized location finding function
  const findMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation: LatLngTuple = [latitude, longitude];

        setUserLocation(newLocation);

        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setView(newLocation, 18);
        }

        setIsLocating(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  // Enhanced layer switching with better zoom handling
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const updateLayers = () => {
      const z = Math.round(map.getZoom() * 100) / 100;
      const useSat = z >= SAT_TRANSITION_ZOOM;

      try {
        // Smooth transition between layers
        if (satLayerRef.current && typeof satLayerRef.current.setOpacity === "function") {
          satLayerRef.current.setOpacity(useSat ? 1 : 0);
        }
        if (baseLayerRef.current && typeof baseLayerRef.current.setOpacity === "function") {
          baseLayerRef.current.setOpacity(useSat ? 0 : 1);
        }
        
        // Force tile refresh if needed
        if (useSat && satLayerRef.current) {
          satLayerRef.current.redraw();
        } else if (!useSat && baseLayerRef.current) {
          baseLayerRef.current.redraw();
        }
      } catch (e) {
        console.warn("Layer toggle warning:", e);
      }
    };

    // Listen to zoom events
    map.on("zoomend", updateLayers);
    map.on("zoomstart", updateLayers);
    
    // Also listen to move events to ensure tiles load
    map.on("moveend", () => {
      if (map.getZoom() >= SAT_TRANSITION_ZOOM && satLayerRef.current) {
        satLayerRef.current.redraw();
      } else if (map.getZoom() < SAT_TRANSITION_ZOOM && baseLayerRef.current) {
        baseLayerRef.current.redraw();
      }
    });

    // Ensure initial state
    updateLayers();

    return () => {
      map.off("zoomend", updateLayers);
      map.off("zoomstart", updateLayers);
      map.off("moveend", updateLayers);
    };
  }, [mapLoaded]);

  // Optimized map initialization - removed heavy Mapillary dependency
  useEffect(() => {
    // Set map loaded state when component mounts
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 100); // Small delay to ensure map is ready

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Clean Map Section - Mobile Style */}
      <div
        ref={mapContainerRef}
        className="h-[600px] bg-white dark:bg-gray-900 rounded-xl shadow-lg relative mb-4 overflow-hidden"
      >
        {/* Minimal Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Naga City, Cebu</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsAddBinModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Add Bin</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Map Content */}
        <div className="h-full w-full relative" style={{ paddingTop: '60px' }}>
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
              <div className="map-loading-spinner"></div>
            </div>
          )}
          <MapErrorBoundary>
            <MapContainer
              center={mapCenter}
              zoom={getSafeZoomLevel(15)}
              minZoom={MAP_CONFIG.zoom.min}
              maxZoom={22}
              className="h-full w-full z-0"
              {...MAP_OPTIONS}
              maxBounds={
                [
                  [MAP_CONFIG.bounds.south, MAP_CONFIG.bounds.west],
                  [MAP_CONFIG.bounds.north, MAP_CONFIG.bounds.east],
                ] as [[number, number], [number, number]]
              }
              zoomSnap={0.25}
              zoomDelta={0.5}
              wheelPxPerZoomLevel={60}
              whenReady={() => setMapLoaded(true)}
              preferCanvas={false}
              renderer={undefined}
            >
              <MapInitializer
                setMapRef={(map) => {
                  (mapContainerRef as any).current._leaflet_map = map;
                  mapRef.current = map;
                  setMapLoaded(true); // notify that the map instance is ready
                }}
              />

              {/* Enhanced base tile layer with better coverage */}
              <TileLayer
                url={tileLayerOptions.base.url}
                ref={(layer) => (baseLayerRef.current = layer)}
                maxZoom={tileLayerOptions.base.maxZoom}
                minZoom={tileLayerOptions.base.minZoom}
                detectRetina={tileLayerOptions.base.detectRetina}
                attribution={tileLayerOptions.base.attribution}
                subdomains={tileLayerOptions.base.subdomains}
                tileSize={tileLayerOptions.base.tileSize}
                zoomOffset={tileLayerOptions.base.zoomOffset}
                updateWhenZooming={false}
                keepBuffer={2}
                maxNativeZoom={18}
              />

              {/* Enhanced satellite tile layer for zoom 15+ */}
              <TileLayer
                url={tileLayerOptions.satellite.url}
                ref={(layer) => (satLayerRef.current = layer)}
                maxNativeZoom={tileLayerOptions.satellite.maxNativeZoom}
                maxZoom={tileLayerOptions.satellite.maxZoom}
                minZoom={tileLayerOptions.satellite.minZoom}
                opacity={tileLayerOptions.satellite.opacity}
                zIndex={tileLayerOptions.satellite.zIndex}
                detectRetina={tileLayerOptions.satellite.detectRetina}
                attribution={tileLayerOptions.satellite.attribution}
                subdomains={tileLayerOptions.satellite.subdomains}
                tileSize={tileLayerOptions.satellite.tileSize}
                zoomOffset={tileLayerOptions.satellite.zoomOffset}
                updateWhenZooming={false}
                keepBuffer={2}
              />

              {/* Fallback tile layer to prevent white areas */}
              <TileLayer
                url={tileLayerOptions.fallback.url}
                maxZoom={tileLayerOptions.fallback.maxZoom}
                minZoom={tileLayerOptions.fallback.minZoom}
                detectRetina={tileLayerOptions.fallback.detectRetina}
                attribution={tileLayerOptions.fallback.attribution}
                subdomains={tileLayerOptions.fallback.subdomains}
                tileSize={tileLayerOptions.fallback.tileSize}
                zoomOffset={tileLayerOptions.fallback.zoomOffset}
                opacity={0.3}
                zIndex={1}
                updateWhenZooming={false}
                keepBuffer={2}
              />

              {/* Map Type Indicator */}
              <MapTypeIndicator transitionZoomLevel={15} />

              {updatedBinLocations.map((bin) => (
                <DynamicBinMarker 
                  key={`${bin.id}-${bin.name}-${bin.timestamp}`} 
                  bin={bin} 
                  onBinClick={handleBinClick} 
                  showPopup={!showRightPanel}
                />
              ))}

              {/* GPS Tracking Line */}
              <GPSTrackingLine
                gpsHistory={gpsHistory.map((point) => ({
                  ...point,
                  timestamp:
                    typeof point.timestamp === "number"
                      ? new Date(point.timestamp).toISOString()
                      : point.timestamp || new Date().toISOString(),
                }))}
                visible={showGPSTracking}
              />

              {/* User Location Marker */}
              {userLocation && (
                <Marker position={userLocation} icon={createUserLocationIcon()}>
                  <Popup>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">Your Location</div>
                      <div className="text-sm text-gray-600">
                        {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </MapErrorBoundary>

          {/* Modern Location Button */}
          <button
            onClick={findMyLocation}
            disabled={isLocating}
            className={`absolute bottom-6 right-6 z-[999] bg-white hover:bg-gray-50 disabled:bg-gray-200 p-4 rounded-full shadow-xl border border-gray-200 transition-all duration-300 ${
              isLocating ? "animate-pulse" : "hover:shadow-2xl hover:scale-105"
            }`}
            title={isLocating ? "Finding your location..." : "Find my location"}
          >
            <svg
              className={`w-6 h-6 text-blue-600 ${isLocating ? "animate-spin" : ""}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {isLocating ? (
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              ) : (
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              )}
            </svg>
          </button>

          {/* Clean Location Success Toast */}
          {userLocation && !isLocating && (
            <div className="absolute top-20 right-4 z-[1000] bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg max-w-sm backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Location found</span>
                </div>
                <button 
                  onClick={() => setUserLocation(null)} 
                  className="ml-3 text-white hover:text-gray-200 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Removed heavy Mapillary components for better performance */}

          {/* Right Panel - Positioned within the map */}
          {showRightPanel && rightPanel && (
            <div className="absolute top-0 right-0 h-full z-[1000] transform transition-transform duration-300 ease-out translate-x-0">
              {rightPanel}
            </div>
          )}
        </div>
      </div>

      {/* Add Bin Modal */}
      <AddBinModal
        isOpen={isAddBinModalOpen}
        onClose={() => setIsAddBinModalOpen(false)}
        onBinRegistered={handleBinRegistered}
      />
    </>
  );
}

export default StaffMapSection;
