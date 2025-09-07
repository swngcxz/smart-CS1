import { StaffMapSection } from "../pages/StaffMapSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Route } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";

export function MapTab() {
  const { wasteBins, loading, error, bin1Data, dynamicBinLocations } = useRealTimeData();

  // Use ONLY real-time bin locations from database - no hardcoded coordinates
  const updatedLocationData = dynamicBinLocations.length > 0 
    ? dynamicBinLocations.map((bin) => ({
        id: bin.id,
        name: bin.name,
        lat: bin.position[0].toString(),
        lng: bin.position[1].toString(),
        status: bin.status,
        level: bin.level,
        lastCollected: bin.lastCollection,
        binData: bin
      }))
    : []; // No fallback to hardcoded coordinates - only show real-time data

  // Calculate summary statistics
  const criticalBins = updatedLocationData.filter((location) => location.status === "critical").length;
  const warningBins = updatedLocationData.filter((location) => location.status === "warning").length;
  const normalBins = updatedLocationData.filter((location) => location.status === "normal").length;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Map View</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StaffMapSection />
        </div>

        <div className="space-y-4">
          {/* Real-time Status Summary */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Real-time Status
                {loading && <span className="text-sm text-gray-500">(Loading...)</span>}
                {error && <span className="text-sm text-red-500">(Error)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Normal</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{normalBins}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warning</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningBins}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalBins}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Location List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {updatedLocationData.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-800 dark:text-white">{location.name}</p>
                        {'binData' in location && location.binData && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {location.lat}, {location.lng}
                      </p>
                      {'binData' in location && location.binData && location.binData.gps_valid && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          GPS: {location.binData.satellites} satellites
                        </p>
                      )}
                      {'lastCollected' in location && location.lastCollected && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Last: {location.lastCollected}
                        </p>
                      )}
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
                    <div className="text-xs text-gray-500 mt-1">
                      {location.status}
                    </div>
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
