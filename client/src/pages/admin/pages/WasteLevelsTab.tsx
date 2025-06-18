import { WasteLevelCards } from "./WasteLevelCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Recycle, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const detailedWasteData = [
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
    location: "Park Avenue",
    level: 45,
    status: "normal",
    lastCollected: "1 day ago",
    capacity: "300L",
    wasteType: "Organic",
    nextCollection: "Tomorrow 9:00 AM",
  },
  {
    id: 3,
    location: "Mall District",
    level: 70,
    status: "warning",
    lastCollected: "4 hours ago",
    capacity: "750L",
    wasteType: "Recyclable",
    nextCollection: "Today 5:00 PM",
  },
  {
    id: 4,
    location: "Residential Area",
    level: 30,
    status: "normal",
    lastCollected: "6 hours ago",
    capacity: "400L",
    wasteType: "Mixed",
    nextCollection: "Tomorrow 11:00 AM",
  },
];

export function WasteLevelsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Waste Levels Management</h2>
        <p className="text-gray-600">Monitor and manage waste levels across all locations.</p>
      </div>
      
      <WasteLevelCards />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Recycle className="w-5 h-5 text-green-600" />
            Detailed Waste Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detailedWasteData.map((bin) => (
              <Card key={bin.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{bin.location}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      bin.status === 'critical' ? 'bg-red-100 text-red-800' :
                      bin.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fill Level:</span>
                      <span className="font-medium">{bin.level}%</span>
                    </div>
                    <Progress value={bin.level} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
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
