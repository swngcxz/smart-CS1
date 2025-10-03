import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Calendar, Users, Activity, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface JanitorPerformance {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  activityCount: number;
  role: string;
  status: string;
  lastActivity?: string;
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
  const [selectedMonth, setSelectedMonth] = useState<string>('10'); // Default to October
  const [selectedYear, setSelectedYear] = useState<string>('2025'); // Default to 2025

  // Generate month options (show only month names)
  const generateMonthOptions = () => {
    const options = [];
    
    // Add all 12 months
    for (let month = 1; month <= 12; month++) {
      const date = new Date(2024, month - 1, 1); // Use any year for formatting
      const label = date.toLocaleDateString('en-US', { month: 'long' });
      
      options.push({ 
        value: month.toString(), 
        label: label
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
        label: year.toString()
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
          year: selectedYear
        }
      });
      
      // Ensure we have the correct data structure
      const data = response.data?.data || response.data;
      // Ensure janitors array is always defined
      if (data && !data.janitors) {
        data.janitors = [];
      }
      setPerformanceData(data);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError(err?.response?.data?.error || 'Failed to fetch performance data');
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedMonth, selectedYear]);

  const monthOptions = generateMonthOptions();
  const yearOptions = generateYearOptions();

  const getPerformanceBadge = (rank: number, total: number) => {
    if (rank === 1 && total > 0) {
      return <Badge className="bg-yellow-500 text-white">Top Performer</Badge>;
    } else if (rank === 2 && total > 1) {
      return <Badge className="bg-gray-400 text-white">Runner-up</Badge>;
    } else if (rank === 3 && total > 2) {
      return <Badge className="bg-orange-600 text-white">Third Place</Badge>;
    } else if (rank <= 5 && total > 4) {
      return <Badge className="bg-blue-500 text-white">Top 5</Badge>;
    }
    return null;
  };

  const getActivityLevel = (count: number) => {
    if (count >= 100) return { label: "Excellent", color: "text-green-600 bg-green-100" };
    if (count >= 50) return { label: "Good", color: "text-blue-600 bg-blue-100" };
    if (count >= 20) return { label: "Average", color: "text-yellow-600 bg-yellow-100" };
    return { label: "Needs Improvement", color: "text-red-600 bg-red-100" };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Performance</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Performance</h2>
        </div>
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchPerformanceData} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Performance</h2>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Top Performer</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {performanceData?.topPerformer?.fullName || "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performanceData?.totalActivities || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Janitors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performanceData?.janitors?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(performanceData?.averageActivities || 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
          Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
 <TableHeader>
  <TableRow>
    <TableHead className="text-center">Rank</TableHead>
    <TableHead className="">Employee</TableHead>
    <TableHead className="text-center">Activities</TableHead>
    <TableHead className="text-center">Performance Level</TableHead>
    <TableHead className="text-center">Status</TableHead>
    <TableHead className="text-center">Achievement</TableHead>
  </TableRow>
</TableHeader>

<TableBody>
  {performanceData?.janitors?.map((janitor, index) => {
    const rank = index + 1;
    const activityLevel = getActivityLevel(janitor.activityCount);

    return (
      <TableRow key={janitor.id}>
        <TableCell className="text-center font-semibold">
          {rank <= 3 ? (
            <span className="text-2xl">
              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
            </span>
          ) : (
            <span className="text-gray-600">#{rank}</span>
          )}
        </TableCell>
       <TableCell className="text-left">
  <div className="flex flex-col">
    <p className="font-medium">{janitor.fullName}</p>
    <p className="text-sm text-gray-500">{janitor.email}</p>
  </div>
</TableCell>

        <TableCell className="text-center">
          <span className="text-lg font-bold text-blue-600">{janitor.activityCount}</span>
        </TableCell>
        <TableCell className="text-center">
          <Badge className={activityLevel.color.replace(/bg-\S+/g, "bg-transparent")}>
            {activityLevel.label}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="default"
            className={
              "bg-transparent " +
              (janitor.status === "active" ? "text-green-800" : "text-gray-700")
            }
          >
            {janitor.status.charAt(0).toUpperCase() + janitor.status.slice(1)}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          {getPerformanceBadge(rank, performanceData?.janitors?.length || 0)}
        </TableCell>
      </TableRow>
    );
  })}
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
