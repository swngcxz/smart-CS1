import { useState } from "react";
import { DataAnalytics } from "../pages/DataAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, CalendarDays } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";

interface BinData {
  id: string;
  route: string;
  lastCollection: string;
  fillLevel: number;
  status: "normal" | "warning" | "critical";
  collectionsThisWeek: number;
  collectionsThisMonth: number;
}

const mockBinData: BinData[] = [
  {
    id: "Bin 1",
    route: "Route A - Downtown",
    lastCollection: "2024-01-15 09:30",
    fillLevel: 45,
    status: "normal",
    collectionsThisWeek: 3,
    collectionsThisMonth: 12,
  },
  {
    id: "Bin 2",
    route: "Route A - Downtown",
    lastCollection: "2024-01-15 10:15",
    fillLevel: 78,
    status: "warning",
    collectionsThisWeek: 2,
    collectionsThisMonth: 10,
  },
  {
    id: "Bin 3",
    route: "Route B - Industrial",
    lastCollection: "2024-01-14 14:20",
    fillLevel: 92,
    status: "critical",
    collectionsThisWeek: 1,
    collectionsThisMonth: 8,
  },
  {
    id: "Bin 4",
    route: "Route C - Residential",
    lastCollection: "2024-01-15 11:45",
    fillLevel: 23,
    status: "normal",
    collectionsThisWeek: 4,
    collectionsThisMonth: 15,
  },
  {
    id: "Bin 5",
    route: "Route B - Industrial",
    lastCollection: "2024-01-15 08:00",
    fillLevel: 67,
    status: "warning",
    collectionsThisWeek: 2,
    collectionsThisMonth: 11,
  },
];

export function AnalyticsTab() {
  const [timeFilter, setTimeFilter] = useState<"week" | "month">("week");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const { wasteBins, loading, error } = useRealTimeData();

  // Combine mock data with real-time data
  const enhancedBinData = mockBinData.map((bin) => {
    // Find corresponding real-time data
    const realTimeBin = wasteBins.find(wb => wb.id === bin.id || wb.location.includes(bin.route.split(' - ')[1]));
    
    if (realTimeBin) {
      return {
        ...bin,
        fillLevel: realTimeBin.level,
        status: realTimeBin.status,
        lastCollection: realTimeBin.lastCollected,
      };
    }
    
    return bin;
  });

  const filteredData = enhancedBinData.filter((bin) => routeFilter === "all" || bin.route.includes(routeFilter));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "default";
    }
  };

  const totalCollections = filteredData.reduce(
    (sum, bin) => sum + (timeFilter === "week" ? bin.collectionsThisWeek : bin.collectionsThisMonth),
    0
  );

  const averageFillLevel = Math.round(filteredData.reduce((sum, bin) => sum + bin.fillLevel, 0) / filteredData.length);

  const criticalBins = filteredData.filter((bin) => bin.status === "critical").length;
  const warningBins = filteredData.filter((bin) => bin.status === "warning").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Waste Analytics & Reports</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={(value: "week" | "month") => setTimeFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={routeFilter} onValueChange={setRouteFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by route" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Routes</SelectItem>
            <SelectItem value="Route A">Route A - Downtown</SelectItem>
            <SelectItem value="Route B">Route B - Industrial</SelectItem>
            <SelectItem value="Route C">Route C - Residential</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {timeFilter === "week" ? "Weekly" : "Monthly"} Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">{totalCollections}</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Fill Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">{averageFillLevel}%</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+8%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Critical Bins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">{criticalBins}</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600">-15%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Route Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">92%</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bin Status Overview */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            Bin Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bin ID</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Fill Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Collection</TableHead>
                  <TableHead className="text-right">{timeFilter === "week" ? "Week" : "Month"} Collections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="font-medium">{bin.id}</TableCell>
                    <TableCell>{bin.route}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className={`h-2.5 rounded-full ${getStatusColor(bin.status)}`}
                            style={{ width: `${bin.fillLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{bin.fillLevel}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(bin.status)}>{bin.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">{bin.lastCollection}</TableCell>
                    <TableCell className="text-right font-medium">
                      {timeFilter === "week" ? bin.collectionsThisWeek : bin.collectionsThisMonth}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataAnalytics />

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              Cost Analysis - {timeFilter === "week" ? "Weekly" : "Monthly"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Fuel Costs", value: timeFilter === "week" ? "$310" : "$1,240", progress: 45 },
              { label: "Vehicle Maintenance", value: timeFilter === "week" ? "$225" : "$890", progress: 32 },
              { label: "Staff Costs", value: timeFilter === "week" ? "$525" : "$2,100", progress: 75 },
              { label: "Bin Maintenance", value: timeFilter === "week" ? "$95" : "$380", progress: 18 },
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Total {timeFilter === "week" ? "Weekly" : "Monthly"} Cost
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {timeFilter === "week" ? "$1,155" : "$4,610"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
