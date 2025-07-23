import { useState } from "react";
import { ActivityLogs } from "../pages/ActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const allActivities = [
  {
    id: 1,
    time: "09:30 AM",
    activity: "Route optimization completed",
    type: "system",
    priority: "low",
    user: "System",
  },
  {
    id: 2,
    time: "09:15 AM",
    activity: "Bin #A-12 marked as full",
    type: "alert",
    priority: "high",
    user: "John Smith",
  },
  {
    id: 3,
    time: "09:00 AM",
    activity: "Staff member John started shift",
    type: "staff",
    priority: "medium",
    user: "HR System",
  },
  {
    id: 4,
    time: "08:45 AM",
    activity: "Collection completed at Central Plaza",
    type: "collection",
    priority: "low",
    user: "Maria Garcia",
  },
  {
    id: 5,
    time: "08:30 AM",
    activity: "Maintenance scheduled for Bin #B-08",
    type: "maintenance",
    priority: "medium",
    user: "David Johnson",
  },
];

const todayStats = [
  { label: "Collections", value: "24", icon: "🚛" },
  { label: "Alerts", value: "3", icon: "⚠️" },
  { label: "Maintenance", value: "1", icon: "🔧" },
  { label: "Route Changes", value: "2", icon: "🗺️" },
];

export function ActivityTab() {
  const [activityType, setActivityType] = useState("All Activities");
  const [dateRange, setDateRange] = useState("Today");

  const filteredActivities = allActivities.filter((activity) => {
    const matchesType =
      activityType === "All Activities" || activity.type.toLowerCase() === activityType.toLowerCase();
    // You can enhance date filtering here
    return matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity Logs</h2>
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
          {/* ⬇ Pass filtered activities here */}
          <ActivityLogs activities={filteredActivities} />
        </div>

        <div className="space-y-4">
          <Card className="bg-white dark:bg-gray-500 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Activity Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Activity Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white rounded-md"
                >
                  <option>All Activities</option>
                  <option value="collection">Collections</option>
                  <option value="alert">Alerts</option>
                  <option value="staff">Staff</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white rounded-md"
                >
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredActivities.slice(0, 5).map((activity, index) => (
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
        </div>
      </div>
    </div>
  );
}
