import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Medal,
  Award,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Star,
  Target,
  BarChart3,
  Crown,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import PerformanceTableSkeleton from "@/components/skeletons/PerformanceTableSkeleton";

interface JanitorPerformance {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  activityCount: number;
  role: string;
  status: string;
  lastActivity?: string;
  bio?: string;
  joinedDate?: string;
}

interface PerformanceData {
  janitors: JanitorPerformance[];
  totalActivities: number;
  topPerformer: JanitorPerformance | null;
  averageActivities: number;
}

export function PerformanceTab() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("10"); // Default to October
  const [selectedYear, setSelectedYear] = useState<string>("2025"); // Default to 2025

  // Generate month options (show only month names)
  const generateMonthOptions = () => {
    const options = [];

    // Add all 12 months
    for (let month = 1; month <= 12; month++) {
      const date = new Date(2024, month - 1, 1); // Use any year for formatting
      const label = date.toLocaleDateString("en-US", { month: "long" });

      options.push({
        value: month.toString(),
        label: label,
      });
    }

    return options;
  };

  // Generate year options (show range of years)
  const generateYearOptions = () => {
    const options = [];

    // Add years from 2020 to 2030
    for (let year = 2030; year >= 2020; year--) {
      options.push({
        value: year.toString(),
        label: year.toString(),
      });
    }

    return options;
  };

  // Fetch janitor performance data
  const fetchPerformanceData = async () => {
    if (!selectedMonth || !selectedYear) {
      return; // Don't fetch if no month/year selected
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/performance/janitors`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
      });

      // Ensure we have the correct data structure
      const data = response.data?.data || response.data;
      // Ensure janitors array is always defined
      if (data && !data.janitors) {
        data.janitors = [];
      }
      setPerformanceData(data);
    } catch (err: any) {
      console.error("Error fetching performance data:", err);
      setError(err?.response?.data?.error || "Failed to fetch performance data");
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to prevent rapid API calls when filters change quickly
    const timeoutId = setTimeout(() => {
      fetchPerformanceData();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedMonth, selectedYear]);

  const monthOptions = generateMonthOptions();
  const yearOptions = generateYearOptions();

  const getPerformanceBadge = (rank: number, total: number) => {
    if (rank === 1 && total > 0) {
      return (
        <Badge className="bg-transparent text-yellow-600 border-yellow-200" variant="outline">
          Top Performer
        </Badge>
      );
    } else if (rank === 2 && total > 1) {
      return (
        <Badge className="bg-transparent text-gray-600 border-gray-200" variant="outline">
          Runner-up
        </Badge>
      );
    } else if (rank === 3 && total > 2) {
      return (
        <Badge className="bg-transparent text-orange-600 border-orange-200" variant="outline">
          Third Place
        </Badge>
      );
    } else if (rank <= 5 && total > 4) {
      return (
        <Badge className="bg-transparent text-blue-600 border-blue-200" variant="outline">
          Top 5
        </Badge>
      );
    }
    return null;
  };

  const getActivityLevel = (count: number, allCounts: number[]) => {
    if (!allCounts || allCounts.length === 0) {
      return { label: "No Data", color: "text-gray-600 bg-gray-100" };
    }

    // Sort counts to find percentiles
    const sortedCounts = [...allCounts].sort((a, b) => b - a);
    const maxCount = sortedCounts[0];
    const minCount = sortedCounts[sortedCounts.length - 1];

    // If all counts are the same, everyone is average
    if (maxCount === minCount) {
      return { label: "Average", color: "text-yellow-600 bg-yellow-100" };
    }

    // Calculate percentile position
    const percentile = (sortedCounts.indexOf(count) / (sortedCounts.length - 1)) * 100;

    // Determine performance level based on percentile
    if (percentile <= 20) {
      return { label: "Excellent", color: "text-green-600 bg-green-100" };
    } else if (percentile <= 40) {
      return { label: "Good", color: "text-blue-600 bg-blue-100" };
    } else if (percentile <= 70) {
      return { label: "Average", color: "text-yellow-600 bg-yellow-100" };
    } else {
      return { label: "Needs Improvement", color: "text-red-600 bg-red-100" };
    }
  };

  // Don't return early on loading - show skeleton instead

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Employee Performance</h2>
        </div>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button
                onClick={fetchPerformanceData}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Employee Performance</h2>
        </div>
      </div>

      {/* Top Performer Section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Performer</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best performing employee this period</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {loading ? (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              ) : performanceData?.topPerformer ? (
                <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {performanceData.topPerformer.fullName
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "N/A"}
                  </span>
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {/* <Crown className="w-6 h-6 text-gray-400" /> */}
                </div>
              )}
            </div>

            {/* Name and Role */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {performanceData?.topPerformer?.fullName || "John Smith"}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {performanceData?.topPerformer?.role?.charAt(0).toUpperCase() +
                      performanceData?.topPerformer?.role?.slice(1) || "Employee"}
                  </p>
                </div>
              )}
            </div>

            {/* Activity Badge */}
            {!loading && (
              <div className="flex-shrink-0">
                <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-1.5 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Acitivities Completed:</p>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {performanceData?.topPerformer?.activityCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Performers Table */}
      <Card className="border-0 bg-transparent shadow-none">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Rankings</h3>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Metrics */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total:{" "}
                    {loading ? (
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 inline-block animate-pulse"></div>
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {performanceData?.totalActivities || 0}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Date Filters */}
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-9 w-28 text-sm border-gray-300 dark:border-gray-700 rounded-lg px-3">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9 w-20 text-sm border-gray-300 dark:border-gray-700 rounded-lg px-3">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    {yearOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center px-3 py-3">Rank</TableHead>
                <TableHead className="px-3 py-3">Employee</TableHead>
                <TableHead className="text-center px-3 py-3">Activities</TableHead>
                <TableHead className="text-center px-3 py-3">Performance Level</TableHead>
                <TableHead className="text-center px-3 py-3">Achievement</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && (!performanceData?.janitors || performanceData.janitors.length === 0) ? (
                <PerformanceTableSkeleton />
              ) : loading && performanceData?.janitors && performanceData.janitors.length > 0 ? (
                // Show existing data with loading overlay
                <>
                  {performanceData.janitors.map((janitor, index) => {
                    const rank = index + 1;
                    const allCounts = performanceData.janitors.map((j) => j.activityCount);
                    const activityLevel = getActivityLevel(janitor.activityCount, allCounts);

                    return (
                      <TableRow key={janitor.id} className="opacity-50">
                        <TableCell className="text-center font-semibold px-3 py-3">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">#{rank}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-left px-3 py-3">
                          <div className="flex flex-col">
                            <p className="font-medium">{janitor.fullName}</p>
                            <p className="text-sm text-gray-500">{janitor.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-3 py-3">
                          <span className="text-lg font-bold text-blue-600">{janitor.activityCount}</span>
                        </TableCell>
                        <TableCell className="text-center px-3 py-3">
                          <Badge className={activityLevel.color.replace(/bg-\S+/g, "bg-transparent")} variant="outline">
                            {activityLevel.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center px-3 py-3">
                          {getPerformanceBadge(rank, performanceData?.janitors?.length || 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <tr>
                    <td colSpan={5} className="text-center py-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Updating...
                      </div>
                    </td>
                  </tr>
                </>
              ) : (
                performanceData?.janitors?.map((janitor, index) => {
                  const rank = index + 1;
                  const allCounts = performanceData.janitors.map((j) => j.activityCount);
                  const activityLevel = getActivityLevel(janitor.activityCount, allCounts);

                  return (
                    <TableRow key={janitor.id}>
                      <TableCell className="text-center font-semibold px-3 py-3">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">#{rank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left px-3 py-3">
                        <div className="flex flex-col">
                          <p className="font-medium">{janitor.fullName}</p>
                          <p className="text-sm text-gray-500">{janitor.email}</p>
                        </div>
                      </TableCell>

                      <TableCell className="text-center px-3 py-3">
                        <span className="text-lg font-bold text-blue-600">{janitor.activityCount}</span>
                      </TableCell>
                      <TableCell className="text-center px-3 py-3">
                        <Badge className={activityLevel.color.replace(/bg-\S+/g, "bg-transparent")} variant="outline">
                          {activityLevel.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-3 py-3">
                        {getPerformanceBadge(rank, performanceData?.janitors?.length || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {performanceData?.janitors?.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No activity data found for the selected period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
