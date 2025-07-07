import { useState } from "react";
import { WasteLevelCards } from "../pages/WasteLevelCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  // ⬇️ Set default selected location to "Central Plaza"
  const [selectedLocation, setSelectedLocation] = useState("Central Plaza");

  const filteredBins = detailedWasteData.filter(
    (bin) => bin.location === selectedLocation
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Waste Levels</h2>
      </div>

      {/* 🔹 Pass the click handler down */}
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
                className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
  );
}
