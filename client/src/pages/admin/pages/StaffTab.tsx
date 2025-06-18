import { StaffTable } from "./StaffTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, MapPin } from "lucide-react";

const staffStats = [
  { label: "Total Staff", value: "12", change: "+2", changeType: "positive" },
  { label: "Active Now", value: "8", change: "", changeType: "neutral" },
  { label: "On Break", value: "2", change: "", changeType: "neutral" },
  { label: "Offline", value: "2", change: "-1", changeType: "negative" },
];

const shiftSchedule = [
  { shift: "Morning (6AM - 2PM)", staff: 4, zones: ["Zone A", "Zone B"] },
  { shift: "Afternoon (2PM - 10PM)", staff: 4, zones: ["Zone C", "Zone D"] },
  { shift: "Night (10PM - 6AM)", staff: 2, zones: ["Emergency Only"] },
];

export function StaffTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Staff Management</h2>
        <p className="text-gray-600">Monitor and manage your waste collection team.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {staffStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.change && (
                  <span className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StaffTable />
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Shift Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shiftSchedule.map((schedule, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm">{schedule.shift}</span>
                    <Badge variant="outline">{schedule.staff} staff</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{schedule.zones.join(", ")}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="font-medium text-sm">Assign Emergency Task</div>
                <div className="text-xs text-gray-600">Quickly assign urgent collection</div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="font-medium text-sm">Schedule Break</div>
                <div className="text-xs text-gray-600">Manage staff break times</div>
              </button>
              <button className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                <div className="font-medium text-sm">Update Location</div>
                <div className="text-xs text-gray-600">Track staff locations</div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
