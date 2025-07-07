import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

// Accept activities as prop (for filtering support)
export function ActivityLogs({ activities }) {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* ⬆ Increased height from 380px to 600px */}
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {activity.type === "alert" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                {activity.type === "system" && <CheckCircle className="w-4 h-4 text-green-500" />}
                {activity.type === "staff" && <Clock className="w-4 h-4 text-blue-500" />}
                {activity.type === "collection" && <CheckCircle className="w-4 h-4 text-green-500" />}
                {activity.type === "maintenance" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{activity.time}</p>
                <p className="text-sm text-gray-800 dark:text-white font-medium">{activity.activity}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</p>
              </div>
              <Badge
                variant={
                  activity.priority === "high"
                    ? "destructive"
                    : activity.priority === "medium"
                    ? "secondary"
                    : "outline"
                }
                className="text-xs shrink-0"
              >
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
