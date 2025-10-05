import { useState, useEffect } from "react";
import { WasteLevelCards } from "../pages/WasteLevelCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealTimeData, WasteBin } from "@/hooks/useRealTimeData";
import { useJanitors, useActivityLogging } from "@/hooks/useStaffApi";
import { toast } from "@/hooks/use-toast";
import { Smartphone, Wifi, WifiOff } from "lucide-react";
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
  const [selectedJanitorId, setSelectedJanitorId] = useState<string | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { wasteBins, loading, error, bin1Data } = useRealTimeData();

  // Debug logging
  console.log("🔍 WasteLevelsTab Debug:", {
    wasteBins,
    loading,
    error,
    bin1Data,
    wasteBinsLength: wasteBins.length,
    isModalOpen,
    selectedBin: selectedBin?.id,
  });
  const { janitors, loading: janitorsLoading, error: janitorsError } = useJanitors();
  const { logActivity, loading: activityLoading, error: activityError } = useActivityLogging();

  // Debug logging to see what janitors data is being fetched
  console.log("🔍 Janitors Debug:", {
    janitors,
    janitorsLength: janitors.length,
    loading: janitorsLoading,
    error: janitorsError,
  });

  // Create real-time data for each location
  const realTimeBins: WasteBin[] = [
    // Central Plaza - ONLY bin1 real-time data (as requested)
    ...wasteBins
      .filter((wb) => wb.location === "Central Plaza" && wb.id === "bin1")
      .map((realTimeBin) => ({
        ...realTimeBin,
        id: realTimeBin.id,
        wasteType: "Mixed",
        nextCollection: "Today 3:00 PM",
      })),

    // Add static backup bins for Central Plaza to show 4 total bins
    {
      id: "2",
      location: "Central Plaza",
      level: 60,
      status: "warning" as const,
      lastCollected: "3 hours ago",
      capacity: "450L",
      wasteType: "Organic",
      nextCollection: "Today 4:30 PM",
    },
    {
      id: "3",
      location: "Central Plaza",
      level: 90,
      status: "critical" as const,
      lastCollected: "1 hour ago",
      capacity: "600L",
      wasteType: "Recyclable",
      nextCollection: "Today 5:30 PM",
    },
    {
      id: "4",
      location: "Central Plaza",
      level: 50,
      status: "normal" as const,
      lastCollected: "5 hours ago",
      capacity: "550L",
      wasteType: "Mixed",
      nextCollection: "Today 6:00 PM",
    },

    // Park Avenue - 4 bins
    {
      id: "5",
      location: "Park Avenue",
      level: 45,
      status: "normal",
      lastCollected: "1 day ago",
      capacity: "300L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 9:00 AM",
    },
    {
      id: "6",
      location: "Park Avenue",
      level: 75,
      status: "warning",
      lastCollected: "3 hours ago",
      capacity: "350L",
      wasteType: "Mixed",
      nextCollection: "Today 7:00 PM",
    },
    {
      id: "7",
      location: "Park Avenue",
      level: 90,
      status: "critical",
      lastCollected: "2 hours ago",
      capacity: "500L",
      wasteType: "Recyclable",
      nextCollection: "Today 8:00 PM",
    },
    {
      id: "8",
      location: "Park Avenue",
      level: 30,
      status: "normal",
      lastCollected: "10 hours ago",
      capacity: "400L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 10:00 AM",
    },

    // Mall District - 4 bins
    {
      id: "9",
      location: "Mall District",
      level: 70,
      status: "warning",
      lastCollected: "4 hours ago",
      capacity: "750L",
      wasteType: "Recyclable",
      nextCollection: "Today 5:00 PM",
    },
    {
      id: "10",
      location: "Mall District",
      level: 60,
      status: "warning",
      lastCollected: "6 hours ago",
      capacity: "650L",
      wasteType: "Mixed",
      nextCollection: "Today 7:00 PM",
    },
    {
      id: "11",
      location: "Mall District",
      level: 95,
      status: "critical",
      lastCollected: "1 hour ago",
      capacity: "800L",
      wasteType: "Recyclable",
      nextCollection: "Today 6:30 PM",
    },
    {
      id: "12",
      location: "Mall District",
      level: 35,
      status: "normal",
      lastCollected: "9 hours ago",
      capacity: "700L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 8:00 AM",
    },

    // Residential Area - 4 bins
    {
      id: "13",
      location: "Residential Area",
      level: 30,
      status: "normal",
      lastCollected: "6 hours ago",
      capacity: "400L",
      wasteType: "Mixed",
      nextCollection: "Tomorrow 11:00 AM",
    },
    {
      id: "14",
      location: "Residential Area",
      level: 55,
      status: "normal",
      lastCollected: "7 hours ago",
      capacity: "350L",
      wasteType: "Organic",
      nextCollection: "Tomorrow 1:00 PM",
    },
    {
      id: "15",
      location: "Residential Area",
      level: 80,
      status: "critical",
      lastCollected: "2 hours ago",
      capacity: "450L",
      wasteType: "Recyclable",
      nextCollection: "Today 9:00 PM",
    },
    {
      id: "16",
      location: "Residential Area",
      level: 65,
      status: "warning",
      lastCollected: "8 hours ago",
      capacity: "420L",
      wasteType: "Mixed",
      nextCollection: "Tomorrow 3:00 PM",
    },
  ];

  const filteredBins = realTimeBins.filter((bin) => bin.location === selectedLocation);

  const handleCardClick = (bin: WasteBin) => {
    console.log("Card clicked:", bin);
    setSelectedBin(bin);
    setSelectedJanitorId(null); // Reset selection on open
    setIsModalOpen(true);
    console.log("Modal should open now");
  };

  const handleAssignTask = async () => {
    if (!selectedJanitorId || !selectedBin) {
      toast({
        title: "Error",
        description: "Please select a janitor and ensure bin data is available",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedJanitor = janitors.find((j) => j.id === selectedJanitorId);
      if (!selectedJanitor) {
        toast({
          title: "Error",
          description: "Selected janitor not found",
          variant: "destructive",
        });
        return;
      }

      await logActivity({
        user_id: "staff-user",
        bin_id: selectedBin.id,
        bin_location: selectedBin.location,
        bin_status: selectedBin.status,
        bin_level: selectedBin.level,
        assigned_janitor_id: selectedJanitorId,
        assigned_janitor_name: selectedJanitor.fullName,
        task_note: taskNote,
        activity_type: "task_assignment",
      });

      // ✅ Close modal first
      setIsModalOpen(false);

      // ✅ Then show toast
      toast({
        title: "Success",
        description: `Task assigned to ${selectedJanitor.fullName}.`,
        duration: 2000,
      });

      window.dispatchEvent(new CustomEvent("activityLogCreated"));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign task",
        variant: "destructive",
      });
    }
  };

  const filteredJanitors = selectedBin
    ? janitors.filter((j) => {
        // Ensure we only show janitors with the correct role
        const hasValidRole = j.role && j.role.toLowerCase() === "janitor";
        // For now, accept any janitor regardless of location to test the data
        const hasMatchingLocation = true; // Temporarily accept all janitors

        // Debug logging to help verify role filtering
        console.log(`🔍 Janitor Filter: ${j.fullName}`, {
          role: j.role,
          location: j.location,
          selectedBinLocation: selectedBin.location,
          hasValidRole,
          hasMatchingLocation,
          source: (j as any).source || "unknown",
        });

        return hasValidRole && hasMatchingLocation;
      })
    : [];

  console.log("🔍 Filtered Janitors Result:", {
    totalJanitors: janitors.length,
    filteredCount: filteredJanitors.length,
    selectedBinLocation: selectedBin?.location,
    filteredJanitors: filteredJanitors.map((j) => ({ name: j.fullName, location: j.location })),
  });
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Waste Level</h2>

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

        <WasteLevelCards onCardClick={setSelectedLocation} />

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
                  onClick={() => handleCardClick(bin)}
                  className="cursor-pointer p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{bin.location}</h3>
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

      {isModalOpen && selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-xl p-6 relative transform transition-transform duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bin Information - {selectedBin.location}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Bin Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              {/* Bin ID */}
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedBin.location.charAt(0).toUpperCase() + selectedBin.location.slice(1)} Bin:
                </span>{" "}
                {selectedBin.id}
              </div>

              {/* GPS Status */}
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">GPS:</span>{" "}
                <span
                  className={`font-semibold ${
                    bin1Data?.gps_valid ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {bin1Data?.gps_valid ? "Online" : "Offline"}
                </span>
              </div>

              {/* Fill Level */}
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">Fill Level</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedBin.status === "critical"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : selectedBin.status === "warning"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {selectedBin.status.toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      selectedBin.level >= 80
                        ? "bg-red-500"
                        : selectedBin.level >= 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${selectedBin.level}%` }}
                  ></div>
                </div>
              </div>

              {/* Last Collected */}
              <div className="mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">Last Collected:</span>{" "}
                {selectedBin.lastCollected}
              </div>

              {/* Weight & Height */}
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2 p-0 border-0 shadow-none bg-transparent -mt-1">
                {/* Weight Section */}
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-900">Weight</span>
                    <span className="text-sm font-medium text-gray-700">{(bin1Data?.weight_kg ?? 0).toFixed()} kg</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        (bin1Data?.weight_percent ?? 0) >= 90
                          ? "bg-red-500"
                          : (bin1Data?.weight_percent ?? 0) >= 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, bin1Data?.weight_percent ?? 0))}%` }}
                    />
                  </div>
                </div>

                {/* Height Section */}
                <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-gray-900">Height</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.max(0, Math.min(100, bin1Data?.height_percent ?? 0))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        (bin1Data?.height_percent ?? 0) >= 90
                          ? "bg-red-500"
                          : (bin1Data?.height_percent ?? 0) >= 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, bin1Data?.height_percent ?? 0))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Suggested Action */}
              <div className="col-span-2 mt-3 text-sm text-gray-700 dark:text-gray-300 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">Suggested Action:</span>{" "}
                {selectedBin.status === "critical"
                  ? "Immediate collection required."
                  : selectedBin.status === "warning"
                  ? "Monitor closely and prepare for collection."
                  : "No action needed at the moment."}
              </div>
            </div>

            {/* Assign & Task Notes */}
            <div className="mt-4 space-y-4">
              {/* Assign Janitor */}
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">
                  Assign to Janitor ({filteredJanitors.length} available)
                </label>
                <Select onValueChange={(val) => setSelectedJanitorId(val)}>
                  <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder={janitorsLoading ? "Loading..." : "Select Janitor"} />
                  </SelectTrigger>
                  <SelectContent>
                    {janitorsLoading ? (
                      <SelectItem disabled value="loading">
                        Loading...
                      </SelectItem>
                    ) : filteredJanitors.length > 0 ? (
                      filteredJanitors.map((janitor) => (
                        <SelectItem key={janitor.id} value={janitor.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{janitor.fullName}</span>
                            <span className="text-xs text-gray-500">
                              {/* {janitor.location} • Role: {janitor.role || "Janitor"} */}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="none">
                        No janitors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Task Notes */}
              <div>
                <label className="block font-semibold text-gray-900 dark:text-white mb-2">Task Notes (Optional)</label>
                <textarea
                  className="w-full h-16 p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white"
                  placeholder="e.g., Clean the Bin."
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end">
                <Button
                  onClick={handleAssignTask}
                  disabled={activityLoading || !selectedJanitorId}
                  className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {activityLoading ? "Assigning..." : "Assign Task"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
