import { MapSection } from "../pages/StaffMapSection";
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Map View</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapSection />
        </div>

        <div className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Location List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationData.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="font-medium text-sm text-gray-800 dark:text-white">{location.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {location.lat}, {location.lng}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        location.status === "critical"
                          ? "destructive"
                          : location.status === "warning"
                          ? "secondary"
                          : "default"
                      }
                      className={
                        location.status === "warning"
                          ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100"
                          : ""
                      }
                    >
                      {location.level}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Routes 
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-600 dark:text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Route A</span>
                  <span className="font-medium">5 Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Route B</span>
                  <span className="font-medium">7 Mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Route C</span>
                  <span className="font-medium">10 Mins</span>
                </div>
                 <div className="flex justify-between items-center">
                  <span className="text-sm">Route D</span>
                  <span className="font-medium">9 Mins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
