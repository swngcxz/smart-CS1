import { useState, useEffect } from "react";
import { ActivityLogs } from "../pages/ActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import api from "@/lib/api";

interface ActivityStats {
  collections: number;
  alerts: number;
  maintenance: number;
  routeChanges: number;
  totalActivities: number;
}

export function ActivityTab() {
  const { wasteBins, loading, error } = useRealTimeData();
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    collections: 0,
    alerts: 0,
    maintenance: 0,
    routeChanges: 0,
    totalActivities: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Fetch activity statistics
  const loadActivityStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      console.log("🔄 Loading activity statistics...");
      const response = await api.get("/api/activitylogs");
      console.log("📊 Activity logs response:", response.data);
      const activities = response.data.activities || response.data;
      
      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const todayActivities = activities.filter(activity => 
        activity.date === today || activity.created_at?.startsWith(today)
      );

      const collections = todayActivities.filter(activity => 
        activity.activity_type === 'collection' || 
        activity.activity_type === 'task_assignment' ||
        activity.activity_type === 'bin_collection'
      ).length;

      const alerts = todayActivities.filter(activity => 
        activity.activity_type === 'bin_alert' || 
        activity.activity_type === 'alert' ||
        activity.bin_status === 'critical' ||
        activity.bin_status === 'warning'
      ).length;

      const maintenance = todayActivities.filter(activity => 
        activity.activity_type === 'maintenance' || 
        activity.activity_type === 'repair'
      ).length;

      const routeChanges = todayActivities.filter(activity => 
        activity.activity_type === 'route_change' || 
        activity.activity_type === 'schedule_update'
      ).length;

      setActivityStats({
        collections,
        alerts,
        maintenance,
        routeChanges,
        totalActivities: todayActivities.length
      });

      console.log("Activity stats loaded:", {
        collections,
        alerts,
        maintenance,
        routeChanges,
        totalActivities: todayActivities.length
      });
    } catch (err: any) {
      console.error("❌ Error loading activity stats:", err);
      console.error("❌ Error response:", err?.response?.data);
      console.error("❌ Error status:", err?.response?.status);
      setStatsError(err?.response?.data?.error || err?.message || "Failed to load activity statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadActivityStats();
  }, []);

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

  // Create dynamic stats array
  const todayStats = [
    { 
      label: "Collections", 
      value: statsLoading ? "..." : activityStats.collections.toString(),
      color: "text-blue-600"
    },
    { 
      label: "Alerts", 
      value: statsLoading ? "..." : activityStats.alerts.toString(),
      color: "text-red-600"
    },
    { 
      label: "Maintenance", 
      value: statsLoading ? "..." : activityStats.maintenance.toString(),
      color: "text-yellow-600"
    },
    { 
      label: "Route Changes", 
      value: statsLoading ? "..." : activityStats.routeChanges.toString(),
      color: "text-green-600"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity Overview</h2>
      </div>

      {statsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {statsError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {todayStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color} dark:text-white`}>
                    {stat.value}
                  </p>
                  {statsLoading && (
                    <p className="text-xs text-gray-500">Loading...</p>
                  )}
                </div>
                <div className={`w-3 h-3 rounded-full ${stat.color.replace('text-', 'bg-')} opacity-60`}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top row: Real-time Alerts + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Activity Logs below stretching full width */}
      <div className="w-full">
        <ActivityLogs onRefresh={loadActivityStats} />
      </div>
    </div>
  );
}
