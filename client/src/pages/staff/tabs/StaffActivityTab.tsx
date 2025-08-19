import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, Filter, RefreshCw } from "lucide-react";
import { StaffActivityLogs } from "../pages/StaffActiviyLogs";
import { useState, useMemo, useEffect } from "react";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useAuth } from "@/hooks/useAuth";

export function StaffActivityTab() {
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  
  // Get user ID from auth context or localStorage, fallback to 'staff-user' for testing
  const storedUserId = localStorage.getItem("userId");
  const userId = storedUserId || "staff-user"; // Use the user ID from your saved data
  
  const { logs, user, loading, error, refetch } = useActivityLogs(userId);

  // Debug logging
  useEffect(() => {
    console.log("StaffActivityTab Debug Info:", {
      storedUserId,
      userId,
      logsCount: logs?.length || 0,
      logs: logs,
      loading,
      error
    });
  }, [storedUserId, userId, logs, loading, error]);

  // Generate dynamic stats based on real data
  const generateStats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return [
        { label: "Collections", value: "0", icon: Activity },
        { label: "Alerts", value: "0", icon: Activity },
        { label: "Maintenance", value: "0", icon: Activity },
        { label: "Route Changes", value: "0", icon: Activity },
      ];
    }

    const collections = logs.filter(log => 
      log.activity_type === 'bin_emptied' || log.activity_type === 'task_assignment'
    ).length;

    const alerts = logs.filter(log => 
      log.bin_status === 'critical' || log.bin_status === 'warning'
    ).length;

    const maintenance = logs.filter(log => 
      log.activity_type === 'maintenance'
    ).length;

    const routeChanges = logs.filter(log => 
      log.activity_type === 'route_change' || log.activity_type === 'schedule_update'
    ).length;

    return [
      { label: "Collections", value: collections.toString(), icon: Activity },
      { label: "Alerts", value: alerts.toString(), icon: Activity },
      { label: "Maintenance", value: maintenance.toString(), icon: Activity },
      { label: "Route Changes", value: routeChanges.toString(), icon: Activity },
    ];
  }, [logs]);

  // Filter activities based on selected filters
  const filteredActivities = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    let filtered = logs;

    // Filter by activity type (excluding error and login)
    if (activityTypeFilter !== "all") {
      filtered = filtered.filter((activity) => activity.activity_type === activityTypeFilter);
    }

    // Filter by date range - show all records by default
    if (dateRangeFilter !== "all") {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (dateRangeFilter === "today") {
        filtered = filtered.filter((activity) => activity.date === today);
      } else if (dateRangeFilter === "yesterday") {
        filtered = filtered.filter((activity) => activity.date === yesterday);
      } else if (dateRangeFilter === "week") {
        filtered = filtered.filter((activity) => activity.date >= weekAgo);
      } else if (dateRangeFilter === "month") {
        filtered = filtered.filter((activity) => activity.date >= monthAgo);
      }
    }

    console.log("Filtered Activities:", {
      originalCount: logs.length,
      filteredCount: filtered.length,
      dateRangeFilter,
      activityTypeFilter
    });

    return filtered;
  }, [logs, activityTypeFilter, dateRangeFilter]);

  const handleApplyFilters = () => {
    console.log("Filters applied:", { activityTypeFilter, dateRangeFilter });
    // The filtering is already applied through useMemo, but you could trigger a refetch here if needed
  };

  const handleRefresh = () => {
    if (refetch) {
      refetch();
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "task_assignment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "bin_emptied":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "route_change":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "schedule_update":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatActivityDescription = (activity: any) => {
    if (activity.bin_id && activity.bin_location) {
      return `Bin ${activity.bin_id} at ${activity.bin_location}`;
    }
    if (activity.task_note) {
      return activity.task_note;
    }
    return activity.activity_type || "Activity logged";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Activity Overview</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {generateStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Recent Activity Summary - Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Filters */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              Activity Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Activity Type</label>
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-gray-500">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="task_assignment">Task Assignment</SelectItem>
                  <SelectItem value="bin_emptied">Bin Emptied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="route_change">Route Change</SelectItem>
                  <SelectItem value="schedule_update">Schedule Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Date Range</label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-green-500">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleApplyFilters}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                Recent Activity Summary
                {loading && <span className="text-sm text-gray-500">(Loading...)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading activities...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
              ) : filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No activities found
                  <div className="text-xs mt-2">
                    Total logs: {logs?.length || 0} | 
                    Date filter: {dateRangeFilter} | 
                    Type filter: {activityTypeFilter}
                  </div>
                </div>
              ) : (
                filteredActivities.slice(0, 3).map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        <Badge className={getActivityTypeColor(activity.activity_type || "unknown")}>
                          {activity.activity_type || "unknown"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-white font-medium">
                        {formatActivityDescription(activity)}
                      </p>
                      {activity.bin_id && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Bin: {activity.bin_id} - {activity.bin_location || "Unknown Location"}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Activity Table - Bottom Section */}
      <div className="space-y-0">
        <StaffActivityLogs />
      </div>
    </div>
  );
}
