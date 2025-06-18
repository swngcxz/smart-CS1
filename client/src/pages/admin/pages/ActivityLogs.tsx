
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle, AlertTriangle, Truck, Users } from "lucide-react";

const activityData = [
  {
    id: 1,
    type: "collection",
    message: "Bin collected at Central Plaza",
    time: "2 hours ago",
    icon: CheckCircle,
    color: "text-green-600",
  },
  {
    id: 2,
    type: "alert",
    message: "High waste level detected at Mall District",
    time: "3 hours ago",
    icon: AlertTriangle,
    color: "text-yellow-600",
  },
  {
    id: 3,
    type: "staff",
    message: "John Smith started shift",
    time: "4 hours ago",
    icon: Users,
    color: "text-blue-600",
  },
  {
    id: 4,
    type: "collection",
    message: "Route optimization completed",
    time: "5 hours ago",
    icon: Truck,
    color: "text-purple-600",
  },
  {
    id: 5,
    type: "alert",
    message: "Maintenance required at Park Avenue",
    time: "6 hours ago",
    icon: AlertTriangle,
    color: "text-red-600",
  },
  {
    id: 6,
    type: "collection",
    message: "Bin emptied at Residential Area",
    time: "8 hours ago",
    icon: CheckCircle,
    color: "text-green-600",
  },
];

export function ActivityLogs() {
  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-600" />
          Activity & History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80 px-6">
          <div className="space-y-4">
            {activityData.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="mt-1">
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
