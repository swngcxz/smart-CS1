import { useState } from "react";
import { ActivityLogs } from "../pages/ActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealTimeData } from "@/hooks/useRealTimeData";

const todayStats = [
  { label: "Collections", value: "24"},
  { label: "Alerts", value: "3"},
  { label: "Maintenance", value: "1"},
  { label: "Route Changes", value: "2" },
];

export function ActivityTab() {
  const { wasteBins, loading, error } = useRealTimeData();

  // Generate real-time activities based on waste bin data
  const generateRealTimeActivities = () => {
    const realTimeActivities = [];
    
    wasteBins.forEach((bin) => {
      if (bin.status === 'critical') {
        realTimeActivities.push({
          id: `rt-${bin.id}-critical`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activity: `Bin ${bin.id} at ${bin.location} is critical (${bin.level}% full)`,
          type: "alert",
          priority: "high",
          user: "Real-time System",
        });
      } else if (bin.status === 'warning') {
        realTimeActivities.push({
          id: `rt-${bin.id}-warning`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activity: `Bin ${bin.id} at ${bin.location} needs attention (${bin.level}% full)`,
          type: "alert",
          priority: "medium",
          user: "Real-time System",
        });
      }
    });
    
    return realTimeActivities;
  };

  const realTimeActivities = generateRealTimeActivities();

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
                <span className="text-2xl"></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* ActivityLogs component now fetches its own data */}
          <ActivityLogs />
        </div>

        <div className="space-y-4">
          <Card className="bg-white dark:bg-gray-500 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                Real-time Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {realTimeActivities.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No active alerts
                </p>
              ) : (
                realTimeActivities.map((activity, index) => (
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
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Total Bins</span>
                <Badge variant="outline">{wasteBins.length}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Critical</span>
                <Badge variant="destructive">
                  {wasteBins.filter(bin => bin.status === 'critical').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Warning</span>
                <Badge variant="secondary">
                  {wasteBins.filter(bin => bin.status === 'warning').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm text-gray-700 dark:text-gray-300">Normal</span>
                <Badge variant="outline">
                  {wasteBins.filter(bin => bin.status === 'normal').length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
