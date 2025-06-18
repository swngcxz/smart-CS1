
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

export function MapSection() {
  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          Bin Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 bg-gradient-to-br from-green-50 to-blue-50 rounded-b-lg relative overflow-hidden">
          {/* Mock map interface */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Navigation className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Interactive Map</p>
              <p className="text-sm text-gray-500">Showing 12 waste bins</p>
            </div>
          </div>
          
          {/* Mock bin locations */}
          <div className="absolute top-16 left-20 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-24 w-3 h-3 bg-green-500 rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </CardContent>
    </Card>
  );
}
