import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { BinMarker } from "./BinMarker";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

export function MapSection() {
  const criticalBins = binLocations.filter((bin) => bin.status === "critical").length;
  const warningBins = binLocations.filter((bin) => bin.status === "warning").length;
  const normalBins = binLocations.filter((bin) => bin.status === "normal").length;

  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pegman = document.getElementById("pegman");
    const streetViewDiv = document.getElementById("street-view");
    const closeBtn = document.getElementById("close-street");

    if (!pegman || !streetViewDiv || !mapContainerRef.current) return;

    const mapArea = mapContainerRef.current.querySelector(".leaflet-container");
    if (!mapArea) return;

    mapArea.addEventListener("dragover", (e) => e.preventDefault());

    mapArea.addEventListener("drop", (e) => {
      e.preventDefault();
      pegman.classList.remove("drag-anim");

      const leafletMap = (mapArea as any)._leaflet_map;
      const containerPoint = leafletMap.mouseEventToContainerPoint(e);
      const latlng = leafletMap.containerPointToLatLng(containerPoint);

      streetViewDiv.classList.remove("hidden");

      new window.google.maps.StreetViewPanorama(streetViewDiv, {
        position: { lat: latlng.lat, lng: latlng.lng },
        pov: { heading: 160, pitch: 0 },
        zoom: 1,
      });
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
    <Card
      ref={mapContainerRef}
      className="h-[700px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 relative"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
          <div className="flex items-center gap-2">Baywalk, Naga City, Cebu</div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Normal ({normalBins})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Warning ({warningBins})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical ({criticalBins})</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 h-full rounded-b-lg overflow-hidden relative z-0">
        <MapContainer
          center={center}
          zoom={18}
          scrollWheelZoom={true}
          zoomControl={true}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {binLocations.map((bin) => (
            <BinMarker key={bin.id} bin={bin} />
          ))}
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
          id="street-view"
          className="absolute top-0 left-0 w-full h-full z-[998] hidden bg-white"
        >
          <button
            id="close-street"
            className="absolute top-2 right-2 bg-black text-white px-3 py-1 rounded z-[999]"
          >
            Close
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
