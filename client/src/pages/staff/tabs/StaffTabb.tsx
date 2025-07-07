import { StaffTable } from "../pages/StaffTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, MapPin } from "lucide-react";

const staffStats = [
  { label: "Total Staff", value: "12", change: "+2", changeType: "positive" },
  { label: "Active Now", value: "8", change: "", changeType: "neutral" },
  { label: "On Break", value: "2", change: "", changeType: "neutral" },
  { label: "Offline", value: "2", change: "-1", changeType: "negative" },
];

const shiftSchedule = [
  { shift: "Morning (6AM - 2PM)", staff: 4, zones: ["Zone A", "Zone B"] },
  { shift: "Afternoon (2PM - 10PM)", staff: 4, zones: ["Zone C", "Zone D"] },
  { shift: "Night (10PM - 6AM)", staff: 2, zones: ["Emergency Only"] },
];

export function StaffTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Staff Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {staffStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.change && (
                  <span className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <StaffTable />
    </div>
  );
}
