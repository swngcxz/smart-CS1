import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivityLogs } from "@/hooks/useActivityLogs";

export function ActivityLogs() {
  // You may want to get the userId from your auth context or JWT
  // For demo, let's assume you store userId in localStorage after login
  // Or decode from JWT if you store it
  // Replace this with your actual logic
  const userId = localStorage.getItem("userId");
  const { logs, user, loading, error } = useActivityLogs(userId || undefined);

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          Recent Activity {user ? `for ${user.name}` : ""}
        </CardTitle>
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
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {activity.date} {activity.time}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white font-medium">
                    Bin: {activity.bin_id} — {activity.status}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    User ID: {activity.user_id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
