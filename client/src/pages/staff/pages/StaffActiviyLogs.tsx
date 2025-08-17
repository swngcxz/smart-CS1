import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useAuth } from "@/hooks/useAuth";

export function StaffActivityLogs() {
  // Get userId from auth context or localStorage, fallback to 'staff-user' for testing
  const storedUserId = localStorage.getItem("userId");
  const userId = storedUserId || "staff-user"; // Use the user ID from your saved data
  
  const { logs, user, loading, error, refetch } = useActivityLogs(userId);

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
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            My Activity Logs {user ? `for ${user.name}` : `for ${userId}`}
          </CardTitle>
          <div className="text-xs text-gray-500">
            User ID: {userId} | Logs: {logs?.length || 0}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 dark:text-red-400">
            {error}
            <button 
              onClick={refetch} 
              className="ml-2 text-blue-500 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No activities to display
            <div className="text-xs mt-2">
              User ID: {userId} | Check if data exists in database
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-40">Details</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatTimestamp(activity.timestamp)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-800 dark:text-white font-medium">
                    {formatActivityDescription(activity)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getActivityTypeColor(activity.activity_type || "unknown")}>
                      {activity.activity_type || "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.bin_id && (
                      <div>
                        <div>Bin: {activity.bin_id}</div>
                        {activity.bin_level !== undefined && (
                          <div>Level: {activity.bin_level}%</div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.bin_status || "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
