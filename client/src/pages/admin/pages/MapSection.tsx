import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { DynamicBinMarker } from "../../staff/pages/DynamicBinMarker";
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
import { MapPin, Wifi, WifiOff } from "lucide-react";
import { getActiveTimeAgo } from "@/utils/timeUtils";
import { getDistanceFromMap } from "@/utils/distanceUtils";
import { Badge } from "@/components/ui/badge";

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
  .leaflet-tile {
    filter: none !important;
    image-rendering: -webkit-optimize-contrast !important;
    image-rendering: crisp-edges !important;
  }
  .leaflet-tile-container {
    image-rendering: -webkit-optimize-contrast !important;
    image-rendering: crisp-edges !important;
  }
  .leaflet-zoom-animated {
    image-rendering: -webkit-optimize-contrast !important;
    image-rendering: crisp-edges !important;
  }
`;

// Inject styles only once
if (typeof document !== "undefined" && !document.getElementById("admin-map-styles")) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "admin-map-styles";
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

// Default center coordinates for Naga City, Cebu - will be overridden by real-time data
const defaultCenter: LatLngTuple = [10.24371, 123.786917];

function MapInitializer({ setMapRef }: { setMapRef: (map: any) => void }) {
  const map = useMap();
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  return null;
}

export function MapSection() {
  const { wasteBins, loading, error, bin1Data, monitoringData, gpsHistory, dynamicBinLocations } = useRealTimeData();
  const [showGPSTracking, setShowGPSTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLngTuple | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedBin, setSelectedBin] = useState<any>(null);

  const handleBinClick = (binId: string) => {
    const bin = updatedBinLocations.find((b) => b.id === binId);
    if (bin) {
      // Merge with bin1Data to ensure we have all timestamp fields
      const enrichedBin = {
        ...bin,
        // Use bin1Data timestamp fields for consistency (with safe fallbacks)
        last_active: bin1Data?.last_active || bin.last_active,
        gps_timestamp: bin1Data?.gps_timestamp || bin.gps_timestamp,
        backup_timestamp: (bin1Data as any)?.backup_timestamp || bin.backup_timestamp,
        coordinates_source: bin1Data?.coordinates_source || bin.coordinates_source,
      };
      setSelectedBin(enrichedBin);
    }
  };

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

  const criticalBins = updatedBinLocations.filter((bin) => bin.status === "critical").length;
  const warningBins = updatedBinLocations.filter((bin) => bin.status === "warning").length;
  const normalBins = updatedBinLocations.filter((bin) => bin.status === "normal").length;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

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
        className="h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 relative mb-4"
      >
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-semibold">Naga City, Cebu</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
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
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
            <div className="map-loading-spinner"></div>
          </div>
        )}
        <MapErrorBoundary>
          <MapContainer
            center={mapCenter}
            zoom={getSafeZoomLevel(12)}
            minZoom={1}
            maxZoom={22}
            className="h-full w-full z-0"
            zoomControl={true}
            attributionControl={true}
            preferCanvas={true}
            zoomSnap={1}
            zoomDelta={1}
            wheelPxPerZoomLevel={120}
          >
          <MapInitializer
            setMapRef={(map) => {
              (mapContainerRef as any).current._leaflet_map = map;
              mapRef.current = map;
            }}
          />
          {/* Direct Tile Layer - Optimized for performance */}
              <DirectTileLayer maxZoom={22} minZoom={1} transitionZoomLevel={15} />
          
          {/* Map Type Indicator */}
          <MapTypeIndicator transitionZoomLevel={15} />
          {updatedBinLocations.map((bin) => (
            <DynamicBinMarker key={bin.id} bin={bin} onBinClick={handleBinClick} />
          ))}

          {/* GPS Tracking Line */}
          <GPSTrackingLine gpsHistory={gpsHistory} visible={showGPSTracking} />

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

        {/* Location Error Toast */}
        {locationError && (
          <div className="absolute top-4 right-4 z-[1000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm">{locationError}</span>
                <button onClick={() => setLocationError(null)} className="ml-2 text-white hover:text-gray-200">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Location Success Toast */}
        {userLocation && !isLocating && (
          <div className="absolute top-4 right-4 z-[1000] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Location found: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </span>
                <button onClick={() => setUserLocation(null)} className=" text-white hover:text-gray-200">
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

        {/* <button id="close-street" className="absolute top-2 right-2 text-black px-3 py-1 rounded z-[999]">
          x
        </button> */}
      </CardContent>
    </Card>

    </>
  );
}
