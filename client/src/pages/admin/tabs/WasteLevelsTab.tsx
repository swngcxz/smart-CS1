import { useState } from "react";
import { WasteLevelCards } from "../pages/WasteLevelCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Example janitorial staff list with location
const janitorialStaff = [
  { id: 1, name: "Janitor Alice", location: "Central Plaza" },
  { id: 2, name: "Janitor Bob", location: "Park Avenue" },
  { id: 3, name: "Janitor Charlie", location: "Mall District" },
  { id: 4, name: "Janitor Daisy", location: "Residential Area" },
  { id: 5, name: "Janitor Ethan", location: "Central Plaza" },
];
// Your waste data with multiple bins in "Central Plaza"
const detailedWasteData = [
  // Central Plaza
  {
    id: 1,
    location: "Central Plaza",
    level: 85,
    status: "critical",
    lastCollected: "2 hours ago",
    capacity: "500L",
    wasteType: "Mixed",
    nextCollection: "Today 3:00 PM",
  },
  {
    id: 2,
    location: "Central Plaza",
    level: 60,
    status: "warning",
    lastCollected: "3 hours ago",
    capacity: "450L",
    wasteType: "Organic",
    nextCollection: "Today 4:30 PM",
  },
  {
    id: 3,
    location: "Central Plaza",
    level: 90,
    status: "critical",
    lastCollected: "1 hour ago",
    capacity: "600L",
    wasteType: "Recyclable",
    nextCollection: "Today 5:30 PM",
  },
  {
    id: 4,
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
    id: 5,
    location: "Park Avenue",
    level: 45,
    status: "normal",
    lastCollected: "1 day ago",
    capacity: "300L",
    wasteType: "Organic",
    nextCollection: "Tomorrow 9:00 AM",
  },
  {
    id: 6,
    location: "Park Avenue",
    level: 75,
    status: "warning",
    lastCollected: "3 hours ago",
    capacity: "350L",
    wasteType: "Mixed",
    nextCollection: "Today 7:00 PM",
  },
  {
    id: 7,
    location: "Park Avenue",
    level: 90,
    status: "critical",
    lastCollected: "2 hours ago",
    capacity: "500L",
    wasteType: "Recyclable",
    nextCollection: "Today 8:00 PM",
  },
  {
    id: 8,
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
    id: 9,
    location: "Mall District",
    level: 70,
    status: "warning",
    lastCollected: "4 hours ago",
    capacity: "750L",
    wasteType: "Recyclable",
    nextCollection: "Today 5:00 PM",
  },
  {
    id: 10,
    location: "Mall District",
    level: 60,
    status: "warning",
    lastCollected: "6 hours ago",
    capacity: "650L",
    wasteType: "Mixed",
    nextCollection: "Today 7:00 PM",
  },
  {
    id: 11,
    location: "Mall District",
    level: 95,
    status: "critical",
    lastCollected: "1 hour ago",
    capacity: "800L",
    wasteType: "Recyclable",
    nextCollection: "Today 6:30 PM",
  },
  {
    id: 12,
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
    id: 13,
    location: "Residential Area",
    level: 30,
    status: "normal",
    lastCollected: "6 hours ago",
    capacity: "400L",
    wasteType: "Mixed",
    nextCollection: "Tomorrow 11:00 AM",
  },
  {
    id: 14,
    location: "Residential Area",
    level: 55,
    status: "normal",
    lastCollected: "7 hours ago",
    capacity: "350L",
    wasteType: "Organic",
    nextCollection: "Tomorrow 1:00 PM",
  },
  {
    id: 15,
    location: "Residential Area",
    level: 80,
    status: "critical",
    lastCollected: "2 hours ago",
    capacity: "450L",
    wasteType: "Recyclable",
    nextCollection: "Today 9:00 PM",
  },
  {
    id: 16,
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
  const [selectedBin, setSelectedBin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJanitorId, setSelectedJanitorId] = useState(null);
const [taskNote, setTaskNote] = useState("");
const [showConfirmation, setShowConfirmation] = useState(false);

  const filteredBins = detailedWasteData.filter(
    (bin) => bin.location === selectedLocation
  );

  const handleCardClick = (bin) => {
    setSelectedBin(bin);
    setSelectedJanitorId(null); // Reset selection on open
    setIsModalOpen(true);
  };

const handleAssignTask = () => {
  if (!selectedJanitorId) {
    setShowConfirmation(false);
    return;
  }

  const janitor = janitorialStaff.find(j => j.id === parseInt(selectedJanitorId));

  // If needed, log or save task assignment here

  // Show confirmation modal (instead of alert)
  setShowConfirmation(true);
};


  const filteredJanitors = selectedBin
    ? janitorialStaff.filter((j) => j.location === selectedBin.location)
    : [];

  return (
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

    {isModalOpen && selectedBin && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-xl p-6 space-y-6 relative">
      {/* Modal Header */}
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Bin Information - {selectedBin.location}
        </h3>
        <button
          onClick={() => setIsModalOpen(false)}
          className="text-gray-500 hover:text-red-600 text-lg font-bold"
        >
          ✕
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
        <div><strong>Next Collection:</strong> {selectedBin.nextCollection}</div>
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
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Assign to Janitor</label>
        <Select onValueChange={(val) => setSelectedJanitorId(val)}>
          <SelectTrigger className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <SelectValue placeholder="Select Janitor" />
          </SelectTrigger>
          <SelectContent>
            {filteredJanitors.length > 0 ? (
              filteredJanitors.map((janitor) => (
                <SelectItem key={janitor.id} value={janitor.id.toString()}>
                  {janitor.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem disabled value="none">No janitors in this location</SelectItem>
            )}
          </SelectContent>
        </Select>
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
          onClick={() => setTaskNote("")}
          className="bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
        >
          Clear
        </Button>
        <Button
          onClick={handleAssignTask}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          Assign Task
        </Button>
      </div>
    </div>
  </div>
)}

{/* Confirmation Modal */}
{showConfirmation && selectedJanitorId && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Task Assigned</h3>
      <p className="text-sm text-gray-800 dark:text-gray-300 mb-4">
        Task successfully assigned to <strong>{janitorialStaff.find(j => j.id === parseInt(selectedJanitorId))?.name}</strong>
        {taskNote && ` with note: "${taskNote}"`}
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


    </div>
  );
}
