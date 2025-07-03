import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Recycle, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const wasteData = [
  {
    id: 1,
    location: "Central Plaza",
    level: 85,
    status: "critical",
    lastCollected: "2 hours ago",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: 2,
    location: "Park Avenue",
    level: 45,
    status: "normal",
    lastCollected: "1 day ago",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: 3,
    location: "Mall District",
    level: 70,
    status: "warning",
    lastCollected: "4 hours ago",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    id: 4,
    location: "Residential Area",
    level: 30,
    status: "normal",
    lastCollected: "6 hours ago",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
];

export function WasteLevelCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {wasteData.map((bin) => {
        const Icon = bin.icon;
        return (
          <Card
            key={bin.id}
            className="hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{bin.location}</CardTitle>
                <div
                  className={`p-2 rounded-full ${
                    bin.status === "critical"
                      ? "bg-red-50 dark:bg-red-900"
                      : bin.status === "warning"
                      ? "bg-yellow-50 dark:bg-yellow-900"
                      : "bg-green-50 dark:bg-green-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      bin.status === "critical"
                        ? "text-red-600 dark:text-red-300"
                        : bin.status === "warning"
                        ? "text-yellow-600 dark:text-yellow-300"
                        : "text-green-600 dark:text-green-300"
                    }`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{bin.level}%</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      bin.status === "critical"
                        ? "bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300"
                        : bin.status === "warning"
                        ? "bg-yellow-50 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300"
                        : "bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300"
                    }`}
                  >
                    {bin.status}
                  </span>
                </div>
                <Progress value={bin.level} className="h-2" />
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Last collected: {bin.lastCollected}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
