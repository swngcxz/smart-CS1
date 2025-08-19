import { useState } from "react";
import { WasteLevelCards } from "../pages/WasteLevelCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealTimeData, WasteBin } from "@/hooks/useRealTimeData";
import { useJanitors, useActivityLogging } from "@/hooks/useStaffApi";
import { toast } from "@/hooks/use-toast";

// Fallback janitorial staff list (will be replaced by backend data)
const fallbackJanitorialStaff = [
  { id: "1", fullName: "Janitor Alice", location: "Central Plaza", role: "Janitor" },
  { id: "2", fullName: "Janitor Bob", location: "Park Avenue", role: "Janitor" },
  { id: "3", fullName: "Janitor Charlie", location: "Mall District", role: "Janitor" },
  { id: "4", fullName: "Janitor Daisy", location: "Residential Area", role: "Janitor" },
  { id: "5", fullName: "Janitor Ethan", location: "Central Plaza", role: "Janitor" },
];
// Your waste data with multiple bins in "Central Plaza"
const detailedWasteData: WasteBin[] = [
  // Central Plaza
  {
    id: "1",
    location: "Central Plaza",
    level: 85,
    status: "critical",
    lastCollected: "2 hours ago",
    capacity: "500L",
    wasteType: "Mixed",
    nextCollection: "Today 3:00 PM",
  },
  {
    id: "2",
    location: "Central Plaza",
    level: 60,
    status: "warning",
    lastCollected: "3 hours ago",
    capacity: "450L",
    wasteType: "Organic",
    nextCollection: "Today 4:30 PM",
  },
  {
    id: "3",
    location: "Central Plaza",
    level: 90,
    status: "critical",
    lastCollected: "1 hour ago",
    capacity: "600L",
    wasteType: "Recyclable",
    nextCollection: "Today 5:30 PM",
  },
  {
    id: "4",
    location: "Central Plaza",
    level: 50,
    status: "normal",
    lastCollected: "5 hours ago",
    capacity: "550L",
    wasteType: "Mixed",
    nextCollection: "Today 6:00 PM",
  },

  // Park Avenue
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

  // Mall District
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

  // Residential Area
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


export function WasteLevelsTab() {
  const [selectedLocation, setSelectedLocation] = useState("Central Plaza");
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJanitorId, setSelectedJanitorId] = useState<string | null>(null);
  const [taskNote, setTaskNote] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { wasteBins, loading, error } = useRealTimeData();
  const { janitors, loading: janitorsLoading, error: janitorsError } = useJanitors();
  const { logActivity, loading: activityLoading, error: activityError } = useActivityLogging();

  // Debug logging to see what janitors data is being fetched
  console.log('Fetched janitors data:', janitors);
  console.log('Janitors loading:', janitorsLoading);
  console.log('Janitors error:', janitorsError);

  // Create real-time data for each location
  const realTimeBins: WasteBin[] = [
    // Central Plaza - 4 bins
    {
      id: "1",
      location: "Central Plaza",
      level: (() => {
        const realTimeBin = wasteBins.find(wb => wb.id === 'bin1');
        return realTimeBin ? realTimeBin.level : 85;
      })(),
      status: (() => {
        const realTimeBin = wasteBins.find(wb => wb.id === 'bin1');
        return realTimeBin ? realTimeBin.status : "critical";
      })(),
      lastCollected: (() => {
        const realTimeBin = wasteBins.find(wb => wb.id === 'bin1');
        return realTimeBin ? realTimeBin.lastCollected : "2 hours ago";
      })(),
      capacity: "500L",
      wasteType: "Mixed",
      nextCollection: "Today 3:00 PM",
      binData: wasteBins.find(wb => wb.id === 'bin1')?.binData
    },
    {
      id: "2",
      location: "Central Plaza",
      level: (() => {
        const realTimeBin = wasteBins.find(wb => wb.id === 'monitoring');
        return realTimeBin ? realTimeBin.level : 60;
      })(),
      status: (() => {
        const realTimeBin = wasteBins.find(wb => wb.id === 'monitoring');
        return realTimeBin ? realTimeBin.status : "warning";
      })(),
      lastCollected: (() => {
        const realTimeBin = wasteBins.find(wb => wb.id === 'monitoring');
        return realTimeBin ? realTimeBin.lastCollected : "3 hours ago";
      })(),
      capacity: "450L",
      wasteType: "Organic",
      nextCollection: "Today 4:30 PM",
      binData: wasteBins.find(wb => wb.id === 'monitoring')?.binData
    },
    {
      id: "3",
      location: "Central Plaza",
      level: 90,
      status: "critical",
      lastCollected: "1 hour ago",
      capacity: "600L",
      wasteType: "Recyclable",
      nextCollection: "Today 5:30 PM",
    },
    {
      id: "4",
      location: "Central Plaza",
      level: 50,
      status: "normal",
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

  const filteredBins = realTimeBins.filter(
    (bin) => bin.location === selectedLocation
  );

  const handleCardClick = (bin: WasteBin) => {
    setSelectedBin(bin);
    setSelectedJanitorId(null); // Reset selection on open
    setIsModalOpen(true);
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
    const selectedJanitor = janitors.find(j => j.id === selectedJanitorId);
    if (!selectedJanitor) {
      toast({
        title: "Error",
        description: "Selected janitor not found",
        variant: "destructive",
      });
      return;
    }

    // Log the activity to the backend
    await logActivity({
      user_id: "staff-user", // You might want to get this from auth context
      bin_id: selectedBin.id,
      bin_location: selectedBin.location,
      bin_status: selectedBin.status,
      bin_level: selectedBin.level,
      assigned_janitor_id: selectedJanitorId,
      assigned_janitor_name: selectedJanitor.fullName,
      task_note: taskNote,
      activity_type: "task_assignment"
    });

    // Show success confirmation
    setShowConfirmation(true);
    
    toast({
      title: "Success",
      description: `Task assigned to ${selectedJanitor.fullName}`,
    });

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
        const hasValidRole = j.role && j.role.toLowerCase() === 'janitor';
        // Accept janitors with same location, unknown location, or generic coverage
        const locationIsGeneric = !j.location || j.location === 'General' || j.location === 'All Routes';
        const hasMatchingLocation = j.location === selectedBin.location || locationIsGeneric;
        
        // Debug logging to help verify role filtering
        console.log(`Janitor ${j.fullName}: role="${j.role}", location="${j.location}", validRole=${hasValidRole}, matchingLocation=${hasMatchingLocation}, source=${(j as any).source || 'unknown'}`);
        
        return hasValidRole && hasMatchingLocation;
      })
    : [];

  return (
    <>
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Waste Level</h2>
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
                      {bin.status}
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
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center bg-gray-800 bg-opacity-50 ">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-xl p-8 space-y-6 relative">
      {/* Modal Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Bin Information - {selectedBin.location}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
            selectedBin.status === "critical"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              : selectedBin.status === "warning"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          }`}>
            {selectedBin.status.toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-gray-500 hover:text-gray-600 text-lg font-bold"
        >
          ×
        </button>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
        <div><strong>Bin ID:</strong> {selectedBin.id}</div>
        <div><strong>Waste Type:</strong> {selectedBin.wasteType}</div>
        <div><strong>Status:</strong> 
          <span className={`ml-1 font-semibold ${
            selectedBin.status === "critical"
              ? "text-red-600"
              : selectedBin.status === "warning"
              ? "text-yellow-600"
              : "text-green-600"
          }`}>{selectedBin.status.toUpperCase()}</span>
        </div>
        <div><strong>Fill Level:</strong> {selectedBin.level}%</div>
        <div><strong>Capacity:</strong> {selectedBin.capacity}</div>
        <div><strong>Est. Waste Volume:</strong> {
          Math.round(parseInt(selectedBin.capacity) * (selectedBin.level / 100))
        }L</div>
        <div><strong>Last Collected:</strong> {selectedBin.lastCollected}</div>
        
        {/* Real-time Data Display */}
        {selectedBin.binData && (
          <>
            <div><strong>Real-time Weight:</strong> {selectedBin.binData.weight_kg} kg</div>
            <div><strong>Real-time Distance:</strong> {selectedBin.binData.distance_cm} cm</div>
            {selectedBin.binData.gps_valid && (
              <>
                <div><strong>GPS:</strong> {selectedBin.binData.latitude?.toFixed(4)}, {selectedBin.binData.longitude?.toFixed(4)}</div>
                <div><strong>Satellites:</strong> {selectedBin.binData.satellites}</div>
              </>
            )}
          </>
        )}
      </div>

      {/* Suggested Action */}
      <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
        <strong>Suggested Action:</strong> {
          selectedBin.status === "critical"
            ? "Immediate collection required."
            : selectedBin.status === "warning"
            ? "Monitor closely and prepare for collection."   
            : "No action needed at the moment."
        }
      </div>

      {/* Assign Janitor */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Assign to Janitor ({filteredJanitors.length} available)
        </label>
        {filteredJanitors.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Available janitors: {filteredJanitors.map(j => j.fullName).join(', ')}
          </div>
        )}
        <Select onValueChange={(val) => setSelectedJanitorId(val)}>
          <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <SelectValue placeholder={janitorsLoading ? "Loading janitors..." : "Select Janitor"} />
          </SelectTrigger>
          <SelectContent>
            {janitorsLoading ? (
              <SelectItem disabled value="loading">Loading janitors...</SelectItem>
            ) : filteredJanitors.length > 0 ? (
                             filteredJanitors.map((janitor) => (
                 <SelectItem key={janitor.id} value={janitor.id}>
                   <div className="flex flex-col">
                     <span className="font-medium">{janitor.fullName}</span>
                     <span className="text-xs text-gray-500">
                       {janitor.location && `${janitor.location}`} • Role: {janitor.role || 'Janitor'}
                     </span>
                   </div>
                 </SelectItem>
               ))
            ) : (
              <SelectItem disabled value="none">No janitors available</SelectItem>
            )}
          </SelectContent>
        </Select>
        {janitorsError && (
          <p className="text-sm text-red-600 mt-1">Error loading janitors: {janitorsError}</p>
        )}
        {!janitorsLoading && filteredJanitors.length === 0 && (
          <p className="text-sm text-yellow-600 mt-1">
            No janitors available for {selectedBin?.location}. Consider assigning a general janitor.
          </p>
        )}
      </div>

      {/* Task Note */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mt-4 mb-2">Task Notes (optional)</label>
        <textarea
          className="w-full h-24 rounded-md border bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white p-2"
          placeholder="E.g., Prioritize recyclable waste. Use PPE."
          value={taskNote}
          onChange={(e) => setTaskNote(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleAssignTask}
          disabled={activityLoading || !selectedJanitorId}
          className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {activityLoading ? "Assigning..." : "Assign Task"}
        </Button>
      </div>
      {activityError && (
        <p className="text-sm text-red-600 mt-2">Error: {activityError}</p>
      )}
    </div>
  </div>
)}

{/* Confirmation Modal */}
{showConfirmation && selectedJanitorId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Task Assigned Successfully</h3>
      <p className="text-sm text-gray-800 dark:text-gray-300 mb-4">
        Task successfully assigned to <strong>{janitors.find(j => j.id === selectedJanitorId)?.fullName}</strong>
        {taskNote && ` with note: "${taskNote}"`}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
        Activity has been logged to the system.
      </p>
      <Button
        onClick={() => {
          setShowConfirmation(false);
          setIsModalOpen(false);
          setTaskNote("");
          setSelectedJanitorId(null);
        }}
        className="w-full bg-green-600 text-white hover:bg-green-700"
      >
        OK
      </Button>
    </div>
  </div>
)}

    </>
  );
}
