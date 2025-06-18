import { MapSection } from "./MapSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Route } from "lucide-react";

const locationData = [
  { id: 1, name: "Central Plaza", lat: "40.7128", lng: "-74.0060", status: "critical", level: 85 },
  { id: 2, name: "Park Avenue", lat: "40.7589", lng: "-73.9851", status: "normal", level: 45 },
  { id: 3, name: "Mall District", lat: "40.7505", lng: "-73.9934", status: "warning", level: 70 },
  { id: 4, name: "Residential Area", lat: "40.7282", lng: "-73.7949", status: "normal", level: 30 },
];

export function MapTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Map View</h2>
        <p className="text-gray-600">View all waste bin locations and their current status on the map.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapSection />
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Location List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationData.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">{location.name}</p>
                      <p className="text-xs text-gray-500">{location.lat}, {location.lng}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={location.status === 'critical' ? 'destructive' : location.status === 'warning' ? 'secondary' : 'default'}
                      className={location.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                    >
                      {location.level}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-purple-600" />
                Route Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Optimal Route Length</span>
                  <span className="font-medium">12.5 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Time</span>
                  <span className="font-medium">2h 15m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Fuel Cost</span>
                  <span className="font-medium">$18.50</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
