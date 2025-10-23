import { useState, useEffect } from "react";
import { WasteLevelCards } from "../pages/WasteLevelCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRealTimeData, WasteBin } from "@/hooks/useRealTimeData";
import { useRegisteredBins } from "@/hooks/useBinApi";
import { Smartphone, Wifi, WifiOff } from "lucide-react";
import { BinInfoModal } from "@/components/popups/BinInfoModal";
import { WasteLevelsSkeleton } from "@/components/skeletons/WasteLevelsSkeleton";
import api from "@/lib/api";

// GSM Status Hook
function useGSMStatus() {
  const [gsmStatus, setGsmStatus] = useState<{
    modemStatus: "connected" | "disconnected" | "not initialized" | "loading";
    phoneNumber: string;
    threshold: string;
    autoSmsEnabled: boolean;
  }>({
    modemStatus: "loading",
    phoneNumber: "",
    threshold: "",
    autoSmsEnabled: false,
  });
  const [gsmLoading, setGsmLoading] = useState(true);
  const [gsmError, setGsmError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGSMStatus = async () => {
      try {
        setGsmLoading(true);
        const response = await api.get("/api/sms-status");
        setGsmStatus({
          modemStatus: response.data.modemStatus,
          phoneNumber: response.data.phoneNumber,
          threshold: response.data.threshold,
          autoSmsEnabled: response.data.autoSmsEnabled,
        });
        setGsmError(null);
      } catch (error: any) {
        console.error("Failed to fetch GSM status:", error);
        setGsmError(error.message || "Failed to fetch GSM status");
        setGsmStatus((prev) => ({ ...prev, modemStatus: "not initialized" }));
      } finally {
        setGsmLoading(false);
      }
    };

    fetchGSMStatus();

    const interval = setInterval(fetchGSMStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return { gsmStatus, gsmLoading, gsmError };
}

export function WasteLevelsTab() {
  const [selectedLocation, setSelectedLocation] = useState("Central Plaza");
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { wasteBins, loading, error, bin1Data, bin2Data } = useRealTimeData();
  const { registeredBins, fetchRegisteredBins, isLoading: loadingRegisteredBins } = useRegisteredBins();

  // Fetch registered bins when component mounts - only once
  useEffect(() => {
    fetchRegisteredBins(true); // Force initial fetch
  }, []); // Empty dependency array - only run once

  // Listen for bin registration events
  useEffect(() => {
    const handleBinRegistered = () => {
      console.log("Bin registered event received, refreshing registered bins...");
      fetchRegisteredBins(true); // Force refresh
    };

    window.addEventListener("binRegistered", handleBinRegistered);
    return () => window.removeEventListener("binRegistered", handleBinRegistered);
  }, []);

  // Get real-time bin1 data - try multiple search strategies
  const realTimeBin1 = wasteBins.find(
    (wb) => (wb.location === "Central Plaza" && wb.id === "bin1") || wb.id === "bin1" // Fallback: just find bin1 regardless of location
  );

  // Get real-time bin2 data - try multiple search strategies
  const realTimeBin2 = wasteBins.find(
    (wb) => (wb.location === "Park Avenue" && wb.id === "bin2") || wb.id === "bin2" // Fallback: just find bin2 regardless of location
  );

  // Enhanced Debug logging for bin2
  console.log("🔍 WasteLevelsTab Debug:", {
    wasteBins,
    loading,
    error,
    bin1Data,
    bin2Data,
    registeredBins,
    wasteBinsLength: wasteBins.length,
    registeredBinsLength: registeredBins.length,
    bin1DataDetails: bin1Data
      ? {
          bin_level: bin1Data.bin_level,
          weight_percent: bin1Data.weight_percent,
          height_percent: bin1Data.height_percent,
          timestamp: bin1Data.timestamp,
          gps_valid: bin1Data.gps_valid,
          latitude: bin1Data.latitude,
          longitude: bin1Data.longitude,
          satellites: bin1Data.satellites,
        }
      : null,
    bin2DataDetails: bin2Data
      ? {
          bin_level: bin2Data.bin_level,
          weight_percent: bin2Data.weight_percent,
          height_percent: bin2Data.height_percent,
          timestamp: bin2Data.timestamp,
          gps_valid: bin2Data.gps_valid,
          latitude: bin2Data.latitude,
          longitude: bin2Data.longitude,
          satellites: bin2Data.satellites,
        }
      : null,
  });

  // Specific bin2 debugging
  console.log("🔍 BIN2 SPECIFIC DEBUG:", {
    bin2DataExists: !!bin2Data,
    bin2Data: bin2Data,
    bin2InWasteBins: wasteBins.find((wb) => wb.id === "bin2"),
    allWasteBinIds: wasteBins.map((wb) => wb.id),
    realTimeBin2: realTimeBin2,
  });

  // Debug logging for real-time bin detection
  console.log("🔍 Real-time bin detection:", {
    wasteBinsCount: wasteBins.length,
    wasteBins: wasteBins.map((wb) => ({
      id: wb.id,
      location: wb.location,
      level: wb.level,
      name: wb.binData?.bin_id || wb.id,
    })),
    realTimeBin1: realTimeBin1
      ? {
          id: realTimeBin1.id,
          location: realTimeBin1.location,
          level: realTimeBin1.level,
          name: realTimeBin1.binData?.bin_id || realTimeBin1.id,
        }
      : null,
    realTimeBin2: realTimeBin2
      ? {
          id: realTimeBin2.id,
          location: realTimeBin2.location,
          level: realTimeBin2.level,
          name: realTimeBin2.binData?.bin_id || realTimeBin2.id,
        }
      : null,
  });

  // Create real-time data for each location
  const realTimeBins: WasteBin[] = [
    // Central Plaza - Add real-time bin1 data + 3 static bins (4 total)
    ...(realTimeBin1
      ? [
          {
            id: realTimeBin1.id,
            location: "Central Plaza", // Force location to Central Plaza for consistency
            level: realTimeBin1.level,
            status: realTimeBin1.status,
            lastCollected: realTimeBin1.lastCollected,
            capacity: realTimeBin1.capacity,
            wasteType: realTimeBin1.wasteType || "Mixed",
            nextCollection: realTimeBin1.nextCollection || "Today 3:00 PM",
            binData: realTimeBin1.binData, // Include binData for live indicator
          },
        ]
      : []),

    // Add registered bins for Central Plaza
    ...registeredBins
      .filter((rb) => rb.assignedLocation === "Central Plaza")
      .map((rb) => ({
        id: rb.binId,
        location: "Central Plaza",
        level: rb.bin_level,
        status: (rb.bin_level > 80 ? "critical" : rb.bin_level > 60 ? "warning" : "normal") as
          | "critical"
          | "warning"
          | "normal",
        lastCollected: "Real-time",
        capacity: "500L",
        wasteType: rb.type || "Mixed",
        nextCollection: "Today 3:00 PM",
      })),

    // Always include the 3 static bins for Central Plaza
    {
      id: "2",
      location: "Central Plaza",
      level: 60,
      status: "warning" as "critical" | "warning" | "normal",
      lastCollected: "3 hours ago",
      capacity: "450L",
      wasteType: "Organic",
      nextCollection: "Today 4:30 PM",
    },
    {
      id: "3",
      location: "Central Plaza",
      level: 90,
      status: "critical" as "critical" | "warning" | "normal",
      lastCollected: "1 hour ago",
      capacity: "600L",
      wasteType: "Recyclable",
      nextCollection: "Today 5:30 PM",
    },
    {
      id: "4",
      location: "Central Plaza",
      level: 50,
      status: "normal" as "critical" | "warning" | "normal",
      lastCollected: "5 hours ago",
      capacity: "550L",
      wasteType: "Mixed",
      nextCollection: "Today 6:00 PM",
    },

    // Park Avenue - Add real-time bin2 data + registered bins + 3 static bins
    ...(realTimeBin2
      ? [
          {
            id: realTimeBin2.id,
            location: "Park Avenue", // Force location to Park Avenue for consistency
            level: realTimeBin2.level,
            status: realTimeBin2.status,
            lastCollected: realTimeBin2.lastCollected,
            capacity: realTimeBin2.capacity,
            wasteType: realTimeBin2.wasteType || "Mixed",
            nextCollection: realTimeBin2.nextCollection || "Today 3:00 PM",
            binData: realTimeBin2.binData, // Include binData for live indicator
          },
        ]
      : []),

    // Add registered bins for Park Avenue (only if no real-time bin2 data)
    ...(realTimeBin2
      ? []
      : registeredBins
          .filter((rb) => rb.assignedLocation === "Park Avenue")
          .map((rb) => ({
            id: rb.binId,
            location: "Park Avenue",
            level: rb.bin_level,
            status: (rb.bin_level > 80 ? "critical" : rb.bin_level > 60 ? "warning" : "normal") as
              | "critical"
              | "warning"
              | "normal",
            lastCollected: "Real-time",
            capacity: "500L",
            wasteType: rb.type || "Mixed",
            nextCollection: "Today 3:00 PM",
          }))),

    // Park Avenue - 3 static bins (critical status)
    {
      id: "5",
      location: "Park Avenue",
      level: 95,
      status: "critical" as "critical" | "warning" | "normal",
      lastCollected: "3 hours ago",
      capacity: "350L",
      wasteType: "Mixed",
      nextCollection: "Today 7:00 PM",
    },
    {
      id: "6",
      location: "Park Avenue",
      level: 90,
      status: "critical" as "critical" | "warning" | "normal",
      lastCollected: "2 hours ago",
      capacity: "500L",
      wasteType: "Recyclable",
      nextCollection: "Today 8:00 PM",
    },
    {
      id: "7",
      location: "Park Avenue",
      level: 88,
      status: "critical" as "critical" | "warning" | "normal",
      lastCollected: "10 hours ago",
      capacity: "400L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 10:00 AM",
    },

    // Mall District - Add registered bins + 4 static bins
    ...registeredBins
      .filter((rb) => rb.assignedLocation === "Mall District")
      .map((rb) => ({
        id: rb.binId,
        location: "Mall District",
        level: rb.bin_level,
        status: (rb.bin_level > 80 ? "critical" : rb.bin_level > 60 ? "warning" : "normal") as
          | "critical"
          | "warning"
          | "normal",
        lastCollected: "Real-time",
        capacity: "500L",
        wasteType: rb.type || "Mixed",
        nextCollection: "Today 3:00 PM",
      })),

    // Mall District - 4 bins (warning status)
    {
      id: "9",
      location: "Mall District",
      level: 75,
      status: "warning" as "critical" | "warning" | "normal",
      lastCollected: "4 hours ago",
      capacity: "750L",
      wasteType: "Recyclable",
      nextCollection: "Today 5:00 PM",
    },
    {
      id: "10",
      location: "Mall District",
      level: 72,
      status: "warning" as "critical" | "warning" | "normal",
      lastCollected: "6 hours ago",
      capacity: "650L",
      wasteType: "Mixed",
      nextCollection: "Today 7:00 PM",
    },
    {
      id: "11",
      location: "Mall District",
      level: 78,
      status: "warning" as "critical" | "warning" | "normal",
      lastCollected: "1 hour ago",
      capacity: "800L",
      wasteType: "Recyclable",
      nextCollection: "Today 6:30 PM",
    },
    {
      id: "12",
      location: "Mall District",
      level: 73,
      status: "warning" as "critical" | "warning" | "normal",
      lastCollected: "9 hours ago",
      capacity: "700L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 8:00 AM",
    },

    // Residential Area - Add registered bins + 4 static bins
    ...registeredBins
      .filter((rb) => rb.assignedLocation === "Residential Area")
      .map((rb) => ({
        id: rb.binId,
        location: "Residential Area",
        level: rb.bin_level,
        status: (rb.bin_level > 80 ? "critical" : rb.bin_level > 60 ? "warning" : "normal") as
          | "critical"
          | "warning"
          | "normal",
        lastCollected: "Real-time",
        capacity: "500L",
        wasteType: rb.type || "Mixed",
        nextCollection: "Today 3:00 PM",
      })),

    // Residential Area - 4 bins
    {
      id: "13",
      location: "Residential Area",
      level: 30,
      status: "normal" as "critical" | "warning" | "normal",
      lastCollected: "6 hours ago",
      capacity: "400L",
      wasteType: "Mixed",
      nextCollection: "Tomorrow 11:00 AM",
    },
    {
      id: "14",
      location: "Residential Area",
      level: 55,
      status: "normal" as "critical" | "warning" | "normal",
      lastCollected: "7 hours ago",
      capacity: "350L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 1:00 PM",
    },
    {
      id: "15",
      location: "Residential Area",
      level: 80,
      status: "critical" as "critical" | "warning" | "normal",
      lastCollected: "2 hours ago",
      capacity: "450L",
      wasteType: "Recyclable",
      nextCollection: "Today 9:00 PM",
    },
    {
      id: "16",
      location: "Residential Area",
      level: 65,
      status: "warning" as "critical" | "warning" | "normal",
      lastCollected: "8 hours ago",
      capacity: "420L",
      wasteType: "Mixed",
      nextCollection: "Tomorrow 3:00 PM",
    },
  ];

  const filteredBins = realTimeBins.filter((bin) => bin.location === selectedLocation);

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleBinClick = (bin: WasteBin) => {
    setSelectedBin(bin);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedBin(null);
  };
  // Show skeleton while loading
  if (loading) {
    return <WasteLevelsSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Waste Level</h2>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 text-sm">
            {/* Live Data Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                loading
                  ? "bg-yellow-100 text-yellow-800"
                  : error
                  ? "bg-red-100 text-red-800"
                  : bin1Data
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  loading
                    ? "bg-yellow-500 animate-pulse"
                    : error
                    ? "bg-red-500"
                    : bin1Data
                    ? "bg-green-500 animate-pulse"
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="text-xs font-medium">
                {loading ? "Connecting..." : error ? "Connection Error" : bin1Data ? "Live Data" : "No Data"}
              </span>
            </div>

            {/* Data Details */}
            {bin1Data && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                | Updated:{" "}
                {(() => {
                  const date = new Date(bin1Data.timestamp || Date.now());
                  return isNaN(date.getTime()) ? "Invalid timestamp" : date.toLocaleTimeString();
                })()}
              </div>
            )}
          </div>
        </div>

        <WasteLevelCards onCardClick={setSelectedLocation} allBins={realTimeBins} />

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              Waste Information - {selectedLocation}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBins.map((bin) => (
                <Card
                  key={bin.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 group"
                  onClick={() => handleBinClick(bin)}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{bin.location}</h3>
                        {(bin.id === "bin1" && bin1Data) || (bin.id === "bin2" && bin2Data) || bin.binData ? (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                          </div>
                        ) : null}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          bin.status === "critical"
                            ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
                            : bin.status === "warning"
                            ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100"
                            : "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                        }`}
                      >
                        {capitalize(bin.status)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span>Fill Level:</span>
                        <span className="font-medium">{bin.level}%</span>
                      </div>
                      <Progress value={bin.level} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Capacity:</span> {bin.capacity}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span> {bin.wasteType}
                      </div>
                      <div>
                        <span className="font-medium">Last Collected:</span> {bin.lastCollected}
                      </div>
                      <div>
                        <span className="font-medium">Next Collection:</span> {bin.nextCollection}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bin Info Modal */}
      <BinInfoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        bin={selectedBin}
        binData={
          selectedBin?.id === "bin1" ? bin1Data : selectedBin?.id === "bin2" ? bin2Data : selectedBin?.binData || null
        }
      />
    </>
  );
}
