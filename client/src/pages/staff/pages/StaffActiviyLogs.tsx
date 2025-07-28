import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useAuth } from "@/hooks/useAuth";

// Example: get userId from logged-in user (from useAuth or localStorage)
export function StaffActivityLogs() {
  // You may want to get the userId from your auth context or JWT
  // For demo, let's assume you store userId in localStorage after login
  // Or decode from JWT if you store it
  // Replace this with your actual logic
  const userId = localStorage.getItem("userId");
  const { logs, user, loading, error } = useActivityLogs(userId || undefined);

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            Recent Activity {user ? `for ${user.name}` : ""}
          </CardTitle>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Time</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-32">User</TableHead>
                <TableHead className="w-40">Assignment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </TableCell>
                  <TableCell className="text-sm text-gray-800 dark:text-white font-medium">
                    {activity.activity}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</TableCell>
                  <TableCell className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {activity.assignment}
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
