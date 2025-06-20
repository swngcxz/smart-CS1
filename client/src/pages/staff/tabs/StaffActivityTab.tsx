import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, Filter } from "lucide-react";
import { StaffActivityLogs } from "../pages/StaffActiviyLogs";
import { useState, useMemo } from "react";

const allActivities = [
  {
    time: "09:30 AM",
    activity: "Jane updated her shift availability",
    type: "update",
    priority: "low",
    date: "2024-06-20",
  },
  {
    time: "09:15 AM",
    activity: "Mark completed Bin #A-12 collection",
    type: "task",
    priority: "medium",
    date: "2024-06-20",
  },
  {
    time: "09:00 AM",
    activity: "New staff member Anna registered",
    type: "onboarding",
    priority: "high",
    date: "2024-06-20",
  },
  {
    time: "08:45 AM",
    activity: "Team Alpha started morning route",
    type: "shift",
    priority: "medium",
    date: "2024-06-20",
  },
  {
    time: "08:30 AM",
    activity: "Carlos reported issue with Bin #B-08",
    type: "report",
    priority: "high",
    date: "2024-06-20",
  },
  {
    time: "05:30 PM",
    activity: "Evening shift completed successfully",
    type: "shift",
    priority: "low",
    date: "2024-06-19",
  },
  {
    time: "03:15 PM",
    activity: "Maintenance check on Vehicle #12",
    type: "task",
    priority: "medium",
    date: "2024-06-19",
  },
];

const todayStats = [
  { label: "Collections", value: "24", icon: Activity },
  { label: "Alerts", value: "3", icon: Activity },
  { label: "Maintenance", value: "1", icon: Activity },
  { label: "Route Changes", value: "2", icon: Activity },
];

export function StaffActivityTab() {
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("today");

  const filteredActivities = useMemo(() => {
    let filtered = allActivities;

    // Filter by activity type
    if (activityTypeFilter !== "all") {
      filtered = filtered.filter((activity) => activity.type === activityTypeFilter);
    }

    // Filter by date range
    if (dateRangeFilter === "today") {
      filtered = filtered.filter((activity) => activity.date === "2024-06-20");
    } else if (dateRangeFilter === "yesterday") {
      filtered = filtered.filter((activity) => activity.date === "2024-06-19");
    }

    return filtered;
  }, [activityTypeFilter, dateRangeFilter]);

  const handleApplyFilters = () => {
    console.log("Filters applied:", { activityTypeFilter, dateRangeFilter });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Staff Activity Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Monitor staff tasks, shifts, and recent actions.</p>
      </div>

      {/* Stats Cards - Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {todayStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Recent Activity Summary - Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Filters */}
        <Card className="bg-green-50 dark:bg-gray-900 border border-green-200 dark:border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="w-8 h-8 flex items-center justify-center">
                <Filter className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              Activity Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Activity Type</label>
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-green-200 dark:border-gray-700 focus:ring-gray-500">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="shift">Shifts</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                  <SelectItem value="update">Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900 dark:text-white">Date Range</label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-green-700 focus:ring-green-500">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleApplyFilters}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
            >
              Apply Filters
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                Quick Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredActivities.slice(0, 3).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-green-50 dark:bg-gray-800 rounded-lg border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded border border-green-200 dark:border-green-700">
                        {activity.time}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.priority === "high"
                            ? "bg-red-500"
                            : activity.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-white font-medium">{activity.activity}</p>
                  </div>
                  <Badge
                    variant={
                      activity.priority === "high"
                        ? "destructive"
                        : activity.priority === "medium"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs font-semibold border-green-300 dark:border-green-600"
                  >
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Activity Table - Bottom Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete Activity Log</h3>
        <StaffActivityLogs />
      </div>
    </div>
  );
}
