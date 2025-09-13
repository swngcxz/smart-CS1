import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRealTimeData } from "@/hooks/useRealTimeData";

interface BinData {
  id: string;
  route: string;
  lastCollection: string;
  fillLevel: number;
  status: "normal" | "warning" | "critical";
  collectionsThisWeek: number;
  collectionsThisMonth: number;
  collectionsThisYear: number;
  location: string;
  timestamp?: string;
  weight?: number;
  gps?: string;
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
    collectionsThisYear: 120,
    location: "Downtown Plaza",
    timestamp: "2024-01-15 09:25",
    weight: 12.5,
    gps: "10.2980, 123.8960",
  },
  {
    id: "Bin 2",
    route: "Route A - Downtown",
    lastCollection: "2024-01-15 10:15",
    fillLevel: 78,
    status: "warning",
    collectionsThisWeek: 2,
    collectionsThisMonth: 10,
    collectionsThisYear: 110,
    location: "Main Street",
    timestamp: "2024-01-15 10:10",
    weight: 9.3,
    gps: "10.2990, 123.8975",
  },
  {
    id: "Bin 3",
    route: "Route B - Industrial",
    lastCollection: "2024-01-14 14:20",
    fillLevel: 92,
    status: "critical",
    collectionsThisWeek: 1,
    collectionsThisMonth: 8,
    collectionsThisYear: 95,
    location: "Industrial Zone 1",
    timestamp: "2024-01-14 14:10",
    weight: 15.2,
    gps: "10.3050, 123.9050",
  },
  {
    id: "Bin 4",
    route: "Route B - Industrial",
    lastCollection: "2024-01-16 08:45",
    fillLevel: 30,
    status: "normal",
    collectionsThisWeek: 4,
    collectionsThisMonth: 14,
    collectionsThisYear: 135,
    location: "Warehouse District",
    timestamp: "2024-01-16 08:40",
    weight: 8.7,
    gps: "10.3070, 123.9100",
  },
  {
    id: "Bin 5",
    route: "Route C - Uptown",
    lastCollection: "2024-01-16 11:05",
    fillLevel: 67,
    status: "warning",
    collectionsThisWeek: 3,
    collectionsThisMonth: 11,
    collectionsThisYear: 101,
    location: "Uptown Mall",
    timestamp: "2024-01-16 11:00",
    weight: 13.4,
    gps: "10.3120, 123.9150",
  },
  {
    id: "Bin 6",
    route: "Route C - Uptown",
    lastCollection: "2024-01-15 18:25",
    fillLevel: 85,
    status: "critical",
    collectionsThisWeek: 2,
    collectionsThisMonth: 9,
    collectionsThisYear: 88,
    location: "Central Park",
    timestamp: "2024-01-15 18:20",
    weight: 14.1,
    gps: "10.3150, 123.9200",
  },
  {
    id: "Bin 7",
    route: "Route D - Suburb",
    lastCollection: "2024-01-16 07:50",
    fillLevel: 40,
    status: "normal",
    collectionsThisWeek: 3,
    collectionsThisMonth: 10,
    collectionsThisYear: 97,
    location: "Greenfield Subdivision",
    timestamp: "2024-01-16 07:45",
    weight: 7.8,
    gps: "10.3200, 123.9300",
  },
  {
    id: "Bin 8",
    route: "Route D - Suburb",
    lastCollection: "2024-01-15 16:40",
    fillLevel: 95,
    status: "critical",
    collectionsThisWeek: 1,
    collectionsThisMonth: 7,
    collectionsThisYear: 82,
    location: "Community Park",
    timestamp: "2024-01-15 16:35",
    weight: 16.2,
    gps: "10.3220, 123.9320",
  },
  {
    id: "Bin 9",
    route: "Route E - Bay Area",
    lastCollection: "2024-01-14 20:10",
    fillLevel: 58,
    status: "warning",
    collectionsThisWeek: 2,
    collectionsThisMonth: 9,
    collectionsThisYear: 93,
    location: "Baywalk Promenade",
    timestamp: "2024-01-14 20:05",
    weight: 11.0,
    gps: "10.3300, 123.9400",
  },
  {
    id: "Bin 10",
    route: "Route E - Bay Area",
    lastCollection: "2024-01-16 09:55",
    fillLevel: 22,
    status: "normal",
    collectionsThisWeek: 5,
    collectionsThisMonth: 16,
    collectionsThisYear: 145,
    location: "Fishing Port",
    timestamp: "2024-01-16 09:50",
    weight: 6.9,
    gps: "10.3330, 123.9450",
  },
];


export function AnalyticsTab() {
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("week");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const { wasteBins } = useRealTimeData();

  // Merge mock with realtime bins
  const enhancedBinData = mockBinData.map((bin) => {
    const realTimeBin = wasteBins.find(
      (wb) => wb.id === bin.id || wb.location.includes(bin.route.split(" - ")[1])
    );
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

  const filteredData = enhancedBinData.filter(
    (bin) => routeFilter === "all" || bin.route.includes(routeFilter)
  );

  // === FIX: Add analytics calculations ===
  const totalCollections = filteredData.reduce((sum, bin) => {
    if (timeFilter === "week") return sum + bin.collectionsThisWeek;
    if (timeFilter === "month") return sum + bin.collectionsThisMonth;
    return sum + bin.collectionsThisYear;
  }, 0);

  const averageFillLevel =
    filteredData.length > 0
      ? Math.round(filteredData.reduce((sum, bin) => sum + bin.fillLevel, 0) / filteredData.length)
      : 0;

  const criticalBins = filteredData.filter((bin) => bin.status === "critical").length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Waste Analytics & Reports
      </h2>

      {/* Time Filter */}
      <Select
        value={timeFilter}
        onValueChange={(v: "week" | "month" | "year") => setTimeFilter(v)}
      >
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


      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {timeFilter === "week"
                ? "Weekly Collections"
                : timeFilter === "month"
                ? "Monthly Collections"
                : "Yearly Collections"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalCollections}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Fill Level</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{averageFillLevel}%</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical Bins</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{criticalBins}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Route Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">92%</span>
          </CardContent>
        </Card>
      </div>

      {/* Bin Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Bin Overview</CardTitle>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                <SelectItem value="Route A">Route A - Downtown</SelectItem>
                <SelectItem value="Route B">Route B - Industrial</SelectItem>
                <SelectItem value="Route C">Route C - Residential</SelectItem>
                <SelectItem value="Route D">Route D - Coastal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Bin ID</TableHead>
                  <TableHead className="text-center">Route</TableHead>
                  <TableHead className="text-center">Timestamp</TableHead>
                  <TableHead className="text-center">Weight (kg)</TableHead>
                  <TableHead className="text-center">Bin Level (%)</TableHead>
                  <TableHead className="text-center">GPS Coordinates</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Last Collection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="text-center font-medium">{bin.id}</TableCell>
                    <TableCell className="text-center">{bin.route}</TableCell>
                    <TableCell className="text-center">{bin.timestamp ?? "N/A"}</TableCell>
                    <TableCell className="text-center">{bin.weight ?? 0}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                            className={`h-2.5 rounded-full ${getStatusColor(bin.status)}`}
                            style={{ width: `${bin.fillLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{bin.fillLevel}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{bin.gps ?? "Invalid GPS"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(bin.status)}>{bin.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm">{bin.lastCollection}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
