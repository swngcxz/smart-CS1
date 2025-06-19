import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, Activity } from "lucide-react";

const recentActivities = [
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

export function ActivityLogs() {
  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Activity className="w-5 h-5 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentActivities.map((activity) => (
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
                activity.priority === "high" ? "destructive" : activity.priority === "medium" ? "secondary" : "outline"
              }
              className="text-xs shrink-0"
            >
              {activity.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
