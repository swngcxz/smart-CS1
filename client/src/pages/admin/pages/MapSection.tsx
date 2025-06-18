import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons (without touching private properties)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Define map center as LatLngTuple
const center: LatLngTuple = [10.2108, 123.7575]; // Naga City, Cebu

// Define bin locations with type annotations
const locations: { id: number; name: string; position: LatLngTuple }[] = [
  { id: 1, name: "Bin A", position: [10.2135, 123.7592] },
  { id: 2, name: "Bin B", position: [10.2150, 123.7550] },
  { id: 3, name: "Bin C", position: [10.2090, 123.7580] },
];

export function MapSection() {
  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Bin Locations - Naga City, Cebu
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-80 rounded-b-lg overflow-hidden">
        {/* Use TailwindCSS classes for full height and width */}
        <MapContainer center={center} zoom={15} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((loc) => (
            <Marker key={loc.id} position={loc.position}>
              <Popup>{loc.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
