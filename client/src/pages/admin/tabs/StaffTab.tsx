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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Information</h2>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      <div className="flex justify-between gap-4">
        {staffStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 
                     border border-transparent hover:border-gray-200 transition-all duration-200 
                     rounded-full px-4 py-2 flex-1"
            >
              <div className="flex items-center gap-2">
                <IconComponent className={`h-5 w-5 ${stat.color}`} />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
              <p className={`text-lg font-semibold ${loading ? "text-gray-400 animate-pulse" : stat.color}`}>
                {loading ? "..." : stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <StaffTable onStaffUpdate={loadStaffCounts} />
    </div>
  );
}
