import { ActivityLogs } from "../pages/ActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, Filter } from "lucide-react";

const recentActivities = [
  { time: "09:30 AM", activity: "Route optimization completed", type: "system", priority: "low" },
  { time: "09:15 AM", activity: "Bin #A-12 marked as full", type: "alert", priority: "high" },
  { time: "09:00 AM", activity: "Staff member John started shift", type: "staff", priority: "medium" },
  { time: "08:45 AM", activity: "Collection completed at Central Plaza", type: "collection", priority: "low" },
  { time: "08:30 AM", activity: "Maintenance scheduled for Bin #B-08", type: "maintenance", priority: "medium" },
];

const todayStats = [
  { label: "Collections", value: "24", icon: "🚛" },
  { label: "Alerts", value: "3", icon: "⚠️" },
  { label: "Maintenance", value: "1", icon: "🔧" },
  { label: "Route Changes", value: "2", icon: "🗺️" },
];

export function ActivityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity & History</h2>
        <p className="text-gray-600 dark:text-gray-400">Track all system activities and historical data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {todayStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityLogs />
        </div>

        <div className="space-y-4">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-green-600" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{activity.time}</p>
                    <p className="text-sm text-gray-800 dark:text-white">{activity.activity}</p>
                  </div>
                  <Badge
                    variant={
                      activity.priority === "high"
                        ? "destructive"
                        : activity.priority === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Filter className="w-5 h-5 text-blue-600" />
                Activity Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Activity Type</label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white rounded-md">
                  <option>All Activities</option>
                  <option>Collections</option>
                  <option>Alerts</option>
                  <option>Staff</option>
                  <option>Maintenance</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Date Range</label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white rounded-md">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Custom Range</option>
                </select>
              </div>
              <button className="w-full p-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors">
                Apply Filters
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
