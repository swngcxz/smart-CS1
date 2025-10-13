import { MapSection } from "../pages/MapSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Route, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { useAllBinsCoordinateStatus, getTimeDifference } from "@/hooks/useGpsBackup";
import { useState } from "react";
import { toast } from "sonner";

export function MapTab() {
  const { wasteBins, loading, error, dynamicBinLocations } = useRealTimeData();
  const { binsStatus, loading: gpsBackupsLoading } = useAllBinsCoordinateStatus();
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState<boolean>(true);

  // Use dynamic bin locations from API or fallback to static data
  const updatedLocationData = dynamicBinLocations.length > 0 
    ? dynamicBinLocations.map((bin) => {
        // Check if this bin has GPS backup data
        const binStatus = binsStatus?.find((status) => status.binId === bin.id);
        const isGpsMalfunctioning = (bin.position[0] === 0 && bin.position[1] === 0);
        
        // Use backup coordinates if live GPS is invalid
        let displayLat = bin.position[0].toString();
        let displayLng = bin.position[1].toString();
        let isUsingBackup = false;
        
        if (isGpsMalfunctioning && binStatus?.backupGPS.valid) {
          displayLat = binStatus.backupGPS.latitude.toString();
          displayLng = binStatus.backupGPS.longitude.toString();
          isUsingBackup = true;
        }
        
        return {
          id: bin.id,
          name: bin.name,
          lat: displayLat,
          lng: displayLng,
          status: bin.status,
          level: bin.level,
          lastCollected: bin.lastCollection,
          binData: bin,
          // GPS backup information
          isGpsOffline: isUsingBackup,
          gpsBackupData: binStatus,
          offlineTime: isUsingBackup && binStatus?.backupGPS.timestamp ? getTimeDifference(binStatus.backupGPS.timestamp) : null
        };
      })
    : wasteBins.map((bin) => ({
        id: bin.id,
        name: bin.location,
        lat: "10.2105", // Default coordinates
        lng: "123.7583",
        status: bin.status,
        level: bin.level,
        lastCollected: bin.lastCollected,
        binData: bin,
        isGpsOffline: false,
        gpsBackupData: null,
        offlineTime: null
      }));

  // Calculate summary statistics
  const criticalBins = updatedLocationData.filter((location) => location.status === "critical").length;
  const warningBins = updatedLocationData.filter((location) => location.status === "warning").length;
  const normalBins = updatedLocationData.filter((location) => location.status === "normal").length;
  const offlineBins = updatedLocationData.filter((location) => location.isGpsOffline).length;

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
    <>
    <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Map View</h2>
          <div className="flex items-center gap-3 text-xs"> {/* smaller font */}
            {/* Real-time Status Display */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> {/* smaller dot */}
                <span className="text-gray-700 dark:text-gray-300">Critical ({criticalBins})</span>
      </div>

              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Warning ({warningBins})</span>
        </div>

              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Normal ({normalBins})</span>
              </div>

          {offlineBins > 0 && (
                <>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                    <span className="text-gray-700 dark:text-gray-300">GPS Offline ({offlineBins})</span>
                            </div>
                </>
          )}
        </div>
      </div>
    </div>

        <div className="w-full pb-10">
          <MapSection />
        </div>
      </div>
    </>
  );
}
