import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAllActivityLogs } from "@/hooks/useActivityLogsApi";
import { useState } from "react";

export function ActivityLogs() {
  const [activityType, setActivityType] = useState<string>("");
  const { logs, loading, error, totalCount } = useAllActivityLogs(100, 0, activityType || undefined);

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "task_assignment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "bin_emptied":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "login":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            All Activity Logs
            <Badge variant="secondary" className="ml-2">
              {totalCount} total
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="task_assignment">Task Assignment</option>
              <option value="bin_emptied">Bin Emptied</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
              <option value="login">Login</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No activities to display</div>
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
            {logs.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getActivityTypeColor(activity.activity_type || "unknown")}>
                      {activity.activity_type || "unknown"}
                    </Badge>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  {activity.bin_id && (
                    <p className="text-sm text-gray-800 dark:text-white font-medium mb-1">
                      Bin: {activity.bin_id} — {activity.bin_location || "Unknown Location"}
                    </p>
                  )}
                  
                  {activity.task_note && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      {activity.task_note}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    {activity.user_id && (
                      <span>User: {activity.user_id}</span>
                    )}
                    {activity.assigned_janitor_name && (
                      <span>Staff: {activity.assigned_janitor_name}</span>
                    )}
                    {activity.bin_level !== undefined && (
                      <span>Level: {activity.bin_level}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
