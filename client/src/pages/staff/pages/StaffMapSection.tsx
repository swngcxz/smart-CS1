
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { LatLngTuple, Map as LeafletMap } from "leaflet";
import { BinMarker } from "./StaffBinMarker";
import { GPSMarker } from "../../admin/pages/GPSMarker";
import { GPSTrackingLine } from "../../admin/pages/GPSTrackingLine";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Viewer } from "mapillary-js";
import "mapillary-js/dist/mapillary.css";
import { useRealTimeData } from "@/hooks/useRealTimeData";

// Leaflet default icon fix
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom ref type to store Leaflet map instance
type MapCardRef = HTMLDivElement & {
  _leaflet_map?: LeafletMap;
};

// Center point and bin data - will be updated dynamically
const getCenterPoint = (bin1Data: any, monitoringData: any): LatLngTuple => {
  // Check if we have valid coordinates from either data source
  const hasValidCoordinates = (data: any) => {
    return data && typeof data.latitude === 'number' && typeof data.longitude === 'number' && 
           !isNaN(data.latitude) && !isNaN(data.longitude);
  };

  // Use bin1 coordinates if valid, otherwise fallback to monitoringData
  if (hasValidCoordinates(bin1Data)) {
    return [bin1Data.latitude, bin1Data.longitude] as LatLngTuple;
  }
  if (hasValidCoordinates(monitoringData)) {
    return [monitoringData.latitude, monitoringData.longitude] as LatLngTuple;
  }
  return [10.2105, 123.7583]; // Fallback center
};

// Dynamic bin locations - only bin1 with real-time coordinates
const getBinLocations = (bin1Data: any, monitoringData: any) => {
  // Check if we have coordinates from either data source
  const hasCoordinates = (data: any) => {
    return data && typeof data.latitude === 'number' && typeof data.longitude === 'number' && 
           !isNaN(data.latitude) && !isNaN(data.longitude);
  };

  // Use bin1Data first, then fallback to monitoringData
  const activeData = hasCoordinates(bin1Data) ? bin1Data : 
                     hasCoordinates(monitoringData) ? monitoringData : null;

  if (activeData) {
    return [
      {
        id: 1,
        name: "Dynamic Bin1",
        position: [activeData.latitude, activeData.longitude] as LatLngTuple,
        level: activeData.bin_level || 0,
        status: (activeData.bin_level || 0) >= 85 ? "critical" as const : 
                (activeData.bin_level || 0) >= 70 ? "warning" as const : "normal" as const,
        lastCollection: activeData.timestamp ? new Date(activeData.timestamp).toLocaleString() : "Unknown",
        route: "Real-time Route",
        isDynamic: true,
      }
    ];
  }
  
  // Return empty array if no valid coordinates
  return [];
};

// Helper component to expose Leaflet map instance
function MapInitializer({ setMapRef }: { setMapRef: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    setMapRef(map);
  }, [map, setMapRef]);
  return null;
}

export function MapSection() {
  const { bin1Data, monitoringData, gpsHistory } = useRealTimeData();
  const [showGPSTracking, setShowGPSTracking] = useState(false);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  
  // Get dynamic bin locations and center point
  const binLocations = getBinLocations(bin1Data, monitoringData);
  const center = getCenterPoint(bin1Data, monitoringData);
  
  // Debug logging to see what data we're receiving
  useEffect(() => {
    console.log('StaffMapSection - Received data:', {
      bin1Data,
      monitoringData,
      binLocations,
      center
    });
  }, [bin1Data, monitoringData, binLocations, center]);
  
  const criticalBins = binLocations.filter((bin) => bin.status === "critical").length;
  const warningBins = binLocations.filter((bin) => bin.status === "warning").length;
  const normalBins = binLocations.filter((bin) => bin.status === "normal").length;

  const mapContainerRef = useRef<MapCardRef>(null);

  // Update map center when dynamic coordinates change
  useEffect(() => {
    if (mapInstance && binLocations.length > 0) {
      const newCenter = getCenterPoint(bin1Data, monitoringData);
      mapInstance.setView(newCenter, mapInstance.getZoom());
    }
  }, [binLocations.length, mapInstance, bin1Data, monitoringData]);

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

  const leafletMap = mapContainerRef.current?._leaflet_map;
  if (!leafletMap) return;

  const containerPoint = leafletMap.mouseEventToContainerPoint(e as unknown as MouseEvent);
  const latlng = leafletMap.containerPointToLatLng(containerPoint);

  streetViewDiv.classList.remove("hidden");
  streetViewDiv.innerHTML = "";

  try {
    const response = await fetch(
      `https://graph.mapillary.com/images?fields=id&closeto=${latlng.lat},${latlng.lng}&radius=50`,
      {
        headers: {
          Authorization:
            "OAuth MLY|24007871562201571|74ae29b189e037740ce91b0c91021115",
        },
      }
    );
    const data = await response.json();
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
    streetViewDiv.innerHTML =
      "<p class='text-center pt-4 text-red-500'>Failed to load imagery.</p>";
  }
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
    <Card
      ref={mapContainerRef}
      className="h-[700px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 relative"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
          <div className="flex items-center gap-2">
            Bin Mapping
            {binLocations.length > 0 ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live Bin1
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                No GPS Signal
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            {/* GPS Tracking Toggle */}
            {gpsHistory.length > 1 && (
              <button
                onClick={() => setShowGPSTracking(!showGPSTracking)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  showGPSTracking 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Toggle GPS tracking path"
              >
                {showGPSTracking ? 'Hide' : 'Show'} Path
              </button>
            )}
            
            {/* Bin Status Counts - only show if we have bins */}
            {binLocations.length > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Normal ({normalBins})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span>Warning ({warningBins})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Critical ({criticalBins})</span>
                </div>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-full rounded-b-lg overflow-hidden relative z-0">
        <MapContainer
          center={center}
          zoom={21}
          scrollWheelZoom
          zoomControl
          className="h-full w-full z-0"
          maxBounds={[[9.8, 123.5], [11.3, 124.1]]}
          maxBoundsViscosity={1.0}
        >
          <MapInitializer
            setMapRef={(map) => {
              if (mapContainerRef.current) {
                mapContainerRef.current._leaflet_map = map;
                setMapInstance(map);
              }
            }}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          
          {/* Only render bins if we have valid GPS data */}
          {binLocations.length > 0 && binLocations.map((bin) => (
            <BinMarker key={bin.id} bin={bin} />
          ))}
          
          {/* Message when no bins are available */}
          {binLocations.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">No Bin Available</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Waiting for GPS signal from Bin1...
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                  Check your Firebase Realtime Database for monitoring/bin1 data
                </p>
              </div>
            </div>
          )}
          
          {/* GPS Marker for real-time location */}
          <GPSMarker gpsData={bin1Data || monitoringData} />
          
          {/* GPS Tracking Line */}
          <GPSTrackingLine gpsHistory={gpsHistory} visible={showGPSTracking} />
        </MapContainer>

        {/* Pegman Icon */}
        <div
          id="pegman"
          draggable
          className="absolute bottom-4 left-4 z-[999] cursor-grab bg-white p-1 rounded-full shadow-lg border transition-transform duration-300"
          title="Drag to Street View"
        >
          <img
            src="https://brandlogos.net/wp-content/uploads/2013/12/google-street-view-vector-logo.png"
            alt="Street View"
            className="w-10 h-10"
          />
        </div>

        {/* Street View Viewer */}
        <div
          id="mapillary-viewer"
          className="absolute top-0 left-0 w-full h-full z-[998] hidden bg-white"
        ></div>

        <button
          id="close-street"
          className="absolute top-2 right-2 text-black px-3 py-1 rounded z-[999]"
        >
          x
        </button>
      </CardContent>
    </Card>
  );
}
