import { MapSection } from "../pages/MapSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Route, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { useState } from "react";
import { toast } from "sonner";

export function MapTab() {
  const { wasteBins, loading, error, dynamicBinLocations } = useRealTimeData();
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(true);

  // Use dynamic bin locations from API or fallback to static data
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
    : wasteBins.map((bin) => ({
        id: bin.id,
        name: bin.location,
        lat: "10.2105", // Default coordinates
        lng: "123.7583",
        status: bin.status,
        level: bin.level,
        lastCollected: bin.lastCollected,
        binData: bin
      }));

  // Calculate summary statistics
  const criticalBins = updatedLocationData.filter((location) => location.status === "critical").length;
  const warningBins = updatedLocationData.filter((location) => location.status === "warning").length;
  const normalBins = updatedLocationData.filter((location) => location.status === "normal").length;

  // Handle route selection
  const handleRouteSelect = (route: string) => {
    setSelectedRoute(route);
    toast.success(`${route.charAt(0).toUpperCase() + route.slice(1).replace('-', ' ')} route selected`);
  };

  // Toggle location dropdown
  const toggleLocationDropdown = () => {
    setIsLocationDropdownOpen(!isLocationDropdownOpen);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Map View</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapSection />
          {/* Additional space below the map */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Map Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This map shows real-time waste bin locations and their current fill levels. 
              Use the location finder button to center the map on your current position.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Real-time Status Summary */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Real-time Status
                {error && <span className="text-sm text-red-500">(Error)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Normal</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{normalBins}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warning</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningBins}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalBins}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-0 h-auto hover:bg-transparent"
                onClick={toggleLocationDropdown}
              >
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Route className="w-4 h-4" />
                  Location List
                </CardTitle>
                {isLocationDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </Button>
            </CardHeader>
            <CardContent className={`transition-all duration-300 ease-in-out ${
              isLocationDropdownOpen 
                ? 'max-h-96 opacity-100 p-4' 
                : 'max-h-0 opacity-0 overflow-hidden p-0'
            }`}>
              <div className="space-y-3">
                {/* Central Plaza Route */}
                <Button 
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
                    ${
                      selectedRoute === "central-plaza"
                        ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                        : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                    }`}
                  onClick={() => handleRouteSelect("central-plaza")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Central Plaza</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "central-plaza"
                          ? "bg-green-700 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>
                
                {/* Park Avenue Route */}
                <Button 
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
                    ${
                      selectedRoute === "park-avenue"
                        ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                        : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                    }`}
                  onClick={() => handleRouteSelect("park-avenue")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Park Avenue</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "park-avenue"
                          ? "bg-green-700 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>
                
                {/* Mall District Route */}
                <Button 
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
                    ${
                      selectedRoute === "mall-district"
                        ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                        : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                    }`}
                  onClick={() => handleRouteSelect("mall-district")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Mall District</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "mall-district"
                          ? "bg-green-700 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>
                
                {/* Residential Route */}
                <Button 
                  className={`w-full justify-start text-left h-auto p-4 border-2 transition-all duration-200 hover:bg-transparent
                    ${
                      selectedRoute === "residential"
                        ? "bg-gray-100 border-green-700 text-black hover:bg-gray-100"
                        : "bg-gray-50 text-black border-gray-300 hover:bg-gray-50"
                    }`}
                  onClick={() => handleRouteSelect("residential")}
                >
                  <div className="flex items-center gap-3 w-full">
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 font-semibold text-sm">Residential Area</div>
                    <Badge
                      className={`text-xs ${
                        selectedRoute === "residential"
                          ? "bg-green-700 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      Active
                    </Badge>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
