import { StaffTable } from "../pages/StaffTable";
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Staff Management</h2>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage your waste collection team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {staffStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.change && (
                  <span className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
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
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Clock className="w-5 h-5 text-blue-600" />
                Shift Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shiftSchedule.map((schedule, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{schedule.shift}</span>
                    <Badge variant="outline">{schedule.staff} staff</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{schedule.zones.join(", ")}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="w-5 h-5 text-purple-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors">
                <div className="font-medium text-sm text-gray-900 dark:text-white">Assign Emergency Task</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Quickly assign urgent collection</div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors">
                <div className="font-medium text-sm text-gray-900 dark:text-white">Schedule Break</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Manage staff break times</div>
              </button>
              <button className="w-full text-left p-3 bg-yellow-50 dark:bg-yellow-900 hover:bg-yellow-100 dark:hover:bg-yellow-800 rounded-lg transition-colors">
                <div className="font-medium text-sm text-gray-900 dark:text-white">Update Location</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Track staff locations</div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
