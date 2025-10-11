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
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "@/styles/map-transitions.css";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { MapPin, Wifi, WifiOff, ChevronDown, ChevronUp } from "lucide-react";
import { getActiveTimeAgo } from "@/utils/timeUtils";
import { getDistanceFromMap } from "@/utils/distanceUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Add custom styles for user location marker
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
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = userLocationStyles;
  document.head.appendChild(styleSheet);
}

// Fix default marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create custom icon for user location
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
  rightPanel?: React.ReactNode;
}

export function StaffMapSection({ onBinClick, showRightPanel, rightPanel }: StaffMapSectionProps) {
  const { wasteBins, loading, error, bin1Data, monitoringData, gpsHistory, dynamicBinLocations } = useRealTimeData();
  const [showGPSTracking, setShowGPSTracking] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(false);
  const [selectedRoute, setSelectedRoute] = useState<string>("");

  const handleBinClick = (binId: string) => {
    if (onBinClick) onBinClick(binId);
  };

  // Handle route selection
  const handleRouteSelect = (route: string) => {
    setSelectedRoute(route);
    toast.success(`${route.charAt(0).toUpperCase() + route.slice(1).replace("-", " ")} route selected`);
  };

  // Toggle location dropdown
  const toggleLocationDropdown = () => {
    setIsLocationDropdownOpen(!isLocationDropdownOpen);
  };
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // New state that indicates the Leaflet map instance is ready
  const [mapLoaded, setMapLoaded] = useState(false);

  // Debug logging for real-time data
  useEffect(() => {
    if (bin1Data) {
      console.log("Staff Map - Real-time bin1 data received:", bin1Data);
      console.log("GPS Valid:", bin1Data.gps_valid, "Coordinates:", bin1Data.latitude, bin1Data.longitude);
    }
    if (dynamicBinLocations.length > 0) {
      console.log("Staff Map - Dynamic bin locations:", dynamicBinLocations);
    }
  }, [bin1Data, dynamicBinLocations]);

  // Use ONLY real-time bin locations from database - no hardcoded coordinates
  const updatedBinLocations =
    dynamicBinLocations.length > 0
      ? dynamicBinLocations.map((bin) => ({
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
          // Add timestamp fields for getActiveTimeAgo function
          last_active: bin.last_active,
          gps_timestamp: bin.gps_timestamp,
          backup_timestamp: bin.backup_timestamp,
          coordinates_source: bin.coordinates_source,
        }))
      : []; // No fallback to hardcoded coordinates - only show real-time data

  // Determine map center based on live GPS data from real-time database
  const mapCenter =
    bin1Data && bin1Data.gps_valid && bin1Data.latitude && bin1Data.longitude
      ? ([bin1Data.latitude, bin1Data.longitude] as LatLngTuple)
      : dynamicBinLocations.length > 0
      ? (dynamicBinLocations[0]?.position as LatLngTuple)
      : defaultCenter; // Only use default as last resort

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // Refs for our custom tile layers
  const baseLayerRef = useRef<any>(null);
  const satLayerRef = useRef<any>(null);

  // --- Satellite / high-zoom configuration ---
  // Esri World Imagery (works without an API key and is commonly used for satellite basemaps)
  // If you prefer Mapbox or Google Maps tiles, swap the URL and add an API key as needed.
  const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const ESRI_SAT_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  // Zoom threshold where we switch from the regular raster basemap to satellite imagery
  const SAT_TRANSITION_ZOOM = 18; // you can tweak this (e.g., 16/17/18) depending on preference

  // Function to get user's current location
  const findMyLocation = () => {
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
  };

  // Toggle satellite/base layer based on current zoom
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const updateLayers = () => {
      const z = Math.round(map.getZoom() * 100) / 100; // keep small decimal precision
      const useSat = z >= SAT_TRANSITION_ZOOM;

      try {
        if (satLayerRef.current && typeof satLayerRef.current.setOpacity === "function") {
          satLayerRef.current.setOpacity(useSat ? 1 : 0);
        }
        if (baseLayerRef.current && typeof baseLayerRef.current.setOpacity === "function") {
          baseLayerRef.current.setOpacity(useSat ? 0 : 1);
        }
      } catch (e) {
        // Some Leaflet layer refs may be null during hot reloads — ignore silently
        console.warn("Layer toggle warning:", e);
      }
    };

    map.on("zoomend", updateLayers);

    // Ensure initial state
    updateLayers();

    return () => {
      map.off("zoomend", updateLayers);
    };
  }, [mapLoaded]);

  // When the map initializes, we set mapRef and mark mapLoaded true via MapInitializer (see below)

  useEffect(() => {
    const pegman = document.getElementById("pegman");
    const streetViewDiv = document.getElementById("mapillary-viewer");
    const closeBtn = document.getElementById("close-street");

    if (!pegman || !streetViewDiv || !mapContainerRef.current) return;

    const mapArea = mapContainerRef.current.querySelector(".leaflet-container");
    if (!mapArea) return;

    mapArea.addEventListener("dragover", (e) => e.preventDefault());

    mapArea.addEventListener("drop", async (e) => {
      e.preventDefault();
      pegman.classList.remove("drag-anim");

      const leafletMap = (mapContainerRef as any).current._leaflet_map;
      if (!leafletMap) return;

      const containerPoint = leafletMap.mouseEventToContainerPoint(e);
      const latlng = leafletMap.containerPointToLatLng(containerPoint);

      streetViewDiv.classList.remove("hidden");
      streetViewDiv.innerHTML = "";

      try {
        const response = await fetch(
          `https://graph.mapillary.com/images?fields=id&closeto=${latlng.lat},${latlng.lng}&radius=50`,
          {
            headers: {
              Authorization: "OAuth MLY|24007871562201571|74ae29b189e037740ce91b0c91021115",
            },
          }
        );
        const data = await response.json();
        console.log("Mapillary API response:", data); // optional: debug

        const imageId = data.data?.[0]?.id;

        if (!imageId) {
          streetViewDiv.innerHTML = "<p class='text-center pt-4'>No imagery found here.</p>";
          return;
        }

        new Viewer({
          accessToken: "MLY|24007871562201571|74ae29b189e037740ce91b0c91021115",
          container: "mapillary-viewer",
          imageId,
        });
      } catch (error) {
        console.error("Failed to load Mapillary image", error);
        streetViewDiv.innerHTML = "<p class='text-center pt-4 text-red-500'>Failed to load imagery.</p>";
      }
    });

    pegman.addEventListener("dragstart", () => {
      pegman.classList.add("drag-anim");
    });

    pegman.addEventListener("dragend", () => {
      pegman.classList.remove("drag-anim");
    });

    closeBtn?.addEventListener("click", () => {
      streetViewDiv.classList.add("hidden");
      streetViewDiv.innerHTML = "";
    });
  }, []);

  return (
    <>
      {/* Map Section */}
      <Card
        ref={mapContainerRef}
        className="h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 relative mb-20"
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
            <div className="flex items-center gap-1">
              <h3 className="text-lg font-semibold">Naga City, Cebu</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {/* Location Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={toggleLocationDropdown}
                >
                  <span>Locations</span>
                  {isLocationDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {/* Dropdown Content */}
                {isLocationDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 space-y-3">
                      {/* Central Plaza Route */}
                      <Button
                        className={`w-full justify-start text-left h-auto p-3 border-1 transition-all duration-200 hover:bg-transparent ${
                          selectedRoute === "central-plaza"
                            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                            : "bg-white text-black border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleRouteSelect("central-plaza")}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1 font-semibold text-sm">Central Plaza</div>
                          <Badge
                            className={`text-xs ${
                              selectedRoute === "central-plaza" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                            }`}
                          >
                            Active
                          </Badge>
                        </div>
                      </Button>

                      {/* Park Avenue Route */}
                      <Button
                        className={`w-full justify-start text-left h-auto p-3 border-1 transition-all duration-200 hover:bg-transparent ${
                          selectedRoute === "park-avenue"
                            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleRouteSelect("park-avenue")}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1 font-semibold text-sm">Park Avenue</div>
                          <Badge
                            className={`text-xs ${
                              selectedRoute === "park-avenue" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                            }`}
                          >
                            Active
                          </Badge>
                        </div>
                      </Button>

                      {/* Mall District Route */}
                      <Button
                        className={`w-full justify-start text-left h-auto p-3 border-1 transition-all duration-200 hover:bg-transparent ${
                          selectedRoute === "mall-district"
                            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleRouteSelect("mall-district")}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1 font-semibold text-sm">Mall District</div>
                          <Badge
                            className={`text-xs ${
                              selectedRoute === "mall-district" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                            }`}
                          >
                            Active
                          </Badge>
                        </div>
                      </Button>

                      {/* Residential Route */}
                      <Button
                        className={`w-full justify-start text-left h-auto p-3 border-1 transition-all duration-200 hover:bg-transparent ${
                          selectedRoute === "residential"
                            ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                            : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleRouteSelect("residential")}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1 font-semibold text-sm">Residential Area</div>
                          <Badge
                            className={`text-xs ${
                              selectedRoute === "residential" ? "bg-green-700 text-white" : "bg-gray-300 text-black"
                            }`}
                          >
                            Active
                          </Badge>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* GPS Tracking Toggle */}
              {gpsHistory.length > 1 && (
                <button
                  onClick={() => setShowGPSTracking(!showGPSTracking)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    showGPSTracking ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  title="Toggle GPS tracking path"
                >
                {showGPSTracking ? "Hide" : "Show"} Path
                </button>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 h-full rounded-b-lg overflow-hidden relative z-0">
          <MapErrorBoundary>
            <MapContainer
              center={mapCenter}
              zoom={getSafeZoomLevel(18)}
              minZoom={MAP_CONFIG.zoom.min}
              maxZoom={22} // allow very close zoom levels
              className="h-full w-full z-0"
              // keep existing map options but override some zoom behavior for smoother/finer zooming
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
            >
              <MapInitializer
                setMapRef={(map) => {
                  (mapContainerRef as any).current._leaflet_map = map;
                  mapRef.current = map;
                  setMapLoaded(true); // notify that the map instance is ready
                }}
              />

              {/* Base raster tile (OpenStreetMap) */}
              <TileLayer
                url={OSM_URL}
                ref={(layer) => (baseLayerRef.current = layer)}
                maxZoom={19}
                detectRetina={true}
                attribution="&copy; OpenStreetMap contributors"
              />

              {/* Satellite tile overlay (Esri World Imagery). Initially invisible (opacity 0) and shown when zoom >= SAT_TRANSITION_ZOOM */}
              <TileLayer
                url={ESRI_SAT_URL}
                ref={(layer) => (satLayerRef.current = layer)}
                maxNativeZoom={19}
                maxZoom={22}
                opacity={0}
                zIndex={15}
                detectRetina={true}
                attribution="Tiles &copy; Esri"
              />

              {/* Keep DirectTileLayer (if you rely on it for custom tile switching) */}
              <DirectTileLayer maxZoom={22} minZoom={1} transitionZoomLevel={18} />

              {/* Map Type Indicator */}
              <MapTypeIndicator transitionZoomLevel={18} />

              {updatedBinLocations.map((bin) => (
                <DynamicBinMarker key={bin.id} bin={bin} onBinClick={handleBinClick} />
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

          {/* Auto Find Location Button (Triangular Arrow) */}
          <button
            onClick={findMyLocation}
            disabled={isLocating}
            className={`absolute bottom-4 right-4 z-[999] bg-white hover:bg-gray-50 disabled:bg-gray-200 p-3 rounded-full shadow-lg border transition-all duration-300 ${
              isLocating ? "animate-pulse" : "hover:shadow-xl"
            }`}
            title={isLocating ? "Finding your location..." : "Find my location"}
          >
            <svg
              className={`w-6 h-6 text-blue-600 ${isLocating ? "animate-spin" : ""}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              {isLocating ? (
                // Spinning loading icon
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              ) : (
                // Location finder icon (crosshair with dot)
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              )}
            </svg>
          </button>

          {/* Location Success Toast */}
          {userLocation && !isLocating && (
            <div className="absolute top-4 right-4 z-[1000] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Location found: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </span>
                <button onClick={() => setUserLocation(null)} className="ml-2 text-white hover:text-gray-200">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Pegman Icon */}
          {/* <div
            id="pegman"
            draggable
            className="absolute bottom-4 right-16 z-[999] cursor-grab bg-white p-1 rounded-full shadow-lg border transition-transform duration-300"
            title="Drag to Street View"
          >
            <img
              src="https://brandlogos.net/wp-content/uploads/2013/12/google-street-view-vector-logo.png"
              alt="Street View"
              className="w-10 h-10"
            />
          </div> */}

          {/* Street View Viewer */}
          <div id="mapillary-viewer" className="absolute top-0 left-0 w-full h-full z-[998] hidden bg-white"></div>

          <button id="close-street" className="absolute top-2 right-2 text-black px-3 py-1 rounded z-[999]">
            x
          </button>

          {/* Right Panel - Positioned within the map */}
          {showRightPanel && rightPanel && (
            <div className="absolute top-0 right-0 h-full z-[1000] animate-in slide-in-from-right duration-300 ease-out">
              {rightPanel}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default StaffMapSection;
