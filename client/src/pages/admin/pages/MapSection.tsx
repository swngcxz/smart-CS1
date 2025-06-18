import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 10.2108, // Naga City, Cebu
  lng: 123.7575,
};

const locations = [
  { id: 1, name: "Bin A", position: { lat: 10.2135, lng: 123.7592 } },
  { id: 2, name: "Bin B", position: { lat: 10.2150, lng: 123.7550 } },
  { id: 3, name: "Bin C", position: { lat: 10.2090, lng: 123.7580 } },
];

export function MapSection() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDn94_ayjJaJa8pbeNJ_eIw7M1r5yP_LhE", 
  });

  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Bin Locations - Naga City, Cebu
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-80 rounded-b-lg overflow-hidden">
        {isLoaded ? (
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}>
            {locations.map((loc) => (
              <Marker key={loc.id} position={loc.position} label={loc.name} />
            ))}
          </GoogleMap>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">Loading map...</div>
        )}
      </CardContent>
    </Card>
  );
}
