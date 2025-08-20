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

// Center point and bin data
const center: LatLngTuple = [10.2105, 123.7583];

const binLocations = [
  {
    id: 1,
    name: "Baywalk Entrance Bin",
    position: [10.2107, 123.7579] as LatLngTuple,
    level: 85,
    status: "critical" as const,
    lastCollection: "2024-01-14 08:30",
    route: "Route A - Baywalk",
  },
  {
    id: 2,
    name: "Seaside Pathway Bin",
    position: [10.2102, 123.7586] as LatLngTuple,
    level: 45,
    status: "normal" as const,
    lastCollection: "2024-01-15 10:15",
    route: "Route A - Baywalk",
  },
  {
    id: 3,
    name: "Playground Area Bin",
    position: [10.2098, 123.7582] as LatLngTuple,
    level: 70,
    status: "warning" as const,
    lastCollection: "2024-01-15 09:45",
    route: "Route A - Baywalk",
  },
  {
    id: 4,
    name: "Picnic Zone Bin",
    position: [10.2101, 123.7576] as LatLngTuple,
    level: 30,
    status: "normal" as const,
    lastCollection: "2024-01-15 11:20",
    route: "Route A - Baywalk",
  },
  {
    id: 5,
    name: "Parking Area Bin",
    position: [10.211, 123.7581] as LatLngTuple,
    level: 92,
    status: "critical" as const,
    lastCollection: "2024-01-13 16:00",
    route: "Route A - Baywalk",
  },
];

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
  
  const criticalBins = binLocations.filter((bin) => bin.status === "critical").length;
  const warningBins = binLocations.filter((bin) => bin.status === "warning").length;
  const normalBins = binLocations.filter((bin) => bin.status === "normal").length;

  const mapContainerRef = useRef<MapCardRef>(null);

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
          <div className="flex items-center gap-2">Baywalk, Naga City, Cebu</div>
          <div className="flex items-center gap-4 text-xs">
            {/* GPS Status */}
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${(bin1Data?.gps_valid || monitoringData?.gps_valid) ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              <span className="flex items-center gap-1">
               GPS: {(bin1Data?.gps_valid || monitoringData?.gps_valid) ? 'Valid' : 'Invalid'}
                {bin1Data?.gps_valid || monitoringData?.gps_valid ? (
                  <span className="text-blue-600">
                    ({bin1Data?.latitude?.toFixed(4) || monitoringData?.latitude?.toFixed(4)}, {bin1Data?.longitude?.toFixed(4) || monitoringData?.longitude?.toFixed(4)})
                  </span>
                ) : null}
              </span>
            </div>
            
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
              }
            }}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {binLocations.map((bin) => (
            <BinMarker key={bin.id} bin={bin} />
          ))}
          
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
