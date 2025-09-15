import { StaffTable } from "../pages/StaffTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface StaffCounts {
  totalStaff: number;
  activeNow: number;
  onBreak: number;
  offline: number;
}

export function StaffTab() {
  const [staffCounts, setStaffCounts] = useState<StaffCounts>({
    totalStaff: 0,
    activeNow: 0,
    onBreak: 0,
    offline: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStaffCounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/staff/status-summary");
      setStaffCounts(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load staff data");
      console.error("Error loading staff counts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffCounts();
  }, []);

  const staffStats = [
    {
      label: "Total Staff",
      value: staffCounts.totalStaff.toString(),
      change: "",
      changeType: "neutral",
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Active Now",
      value: staffCounts.activeNow.toString(),
      change: "",
      changeType: "positive",
      icon: Clock,
      color: "text-green-600",
    },
    {
      label: "On Break",
      value: staffCounts.onBreak.toString(),
      change: "",
      changeType: "neutral",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Offline",
      value: staffCounts.offline.toString(),
      change: "",
      changeType: "negative",
      icon: Users,
      color: "text-red-600",
    },
  ];

  const shiftSchedule = [
    { shift: "Morning (6AM - 2PM)", staff: 4, zones: ["Zone A", "Zone B"] },
    { shift: "Afternoon (2PM - 10PM)", staff: 4, zones: ["Zone C", "Zone D"] },
    { shift: "Night (10PM - 6AM)", staff: 2, zones: ["Emergency Only"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Staff Information</h2>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {staffStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <IconComponent className="w-4 h-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <span className={`text-2xl font-bold ${stat.color}`}>{loading ? "..." : stat.value}</span>
                  {stat.change && (
                    <span className={`text-xs ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <StaffTable onStaffUpdate={loadStaffCounts} />
    </div>
  );
}
