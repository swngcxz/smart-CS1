import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { MapPin } from "lucide-react";
import { BinMarker } from "./BinMarker";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Define map center
const center: LatLngTuple = [10.2108, 123.7575]; // Naga City, Cebu

// Enhanced bin locations with waste levels and additional data
const binLocations = [
  {
    id: 1,
    name: "Central Plaza Bin",
    position: [10.2135, 123.7592] as LatLngTuple,
    level: 85,
    status: "critical" as const,
    lastCollection: "2024-01-14 08:30",
    route: "Route A - Downtown",
  },
  {
    id: 2,
    name: "Park Avenue Bin",
    position: [10.215, 123.755] as LatLngTuple,
    level: 45,
    status: "normal" as const,
    lastCollection: "2024-01-15 10:15",
    route: "Route A - Downtown",
  },
  {
    id: 3,
    name: "Mall District Bin",
    position: [10.209, 123.758] as LatLngTuple,
    level: 70,
    status: "warning" as const,
    lastCollection: "2024-01-15 09:45",
    route: "Route B - Commercial",
  },
  {
    id: 4,
    name: "Residential Area Bin",
    position: [10.2065, 123.7612] as LatLngTuple,
    level: 30,
    status: "normal" as const,
    lastCollection: "2024-01-15 11:20",
    route: "Route C - Residential",
  },
  {
    id: 5,
    name: "Industrial Zone Bin",
    position: [10.218, 123.752] as LatLngTuple,
    level: 92,
    status: "critical" as const,
    lastCollection: "2024-01-13 16:00",
    route: "Route B - Commercial",
  },
];

export function MapSection() {
  const criticalBins = binLocations.filter((bin) => bin.status === "critical").length;
  const warningBins = binLocations.filter((bin) => bin.status === "warning").length;
  const normalBins = binLocations.filter((bin) => bin.status === "normal").length;

  return (
    <Card className="h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-gray-800 dark:text-white">
          <div className="flex items-center gap-2">
          BayWalk Naga City, Cebu
          </div>
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
      <CardContent className="p-0 h-80 rounded-b-lg overflow-hidden relative z-0">
        <MapContainer center={center} zoom={15} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {binLocations.map((bin) => (
            <BinMarker key={bin.id} bin={bin} />
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
