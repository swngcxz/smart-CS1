import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRealTimeData } from "@/hooks/useRealTimeData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Loader2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BinData {
  id: string;
  route: string;
  lastCollection: string | number;
  fillLevel: number;
  status: "normal" | "warning" | "critical";
  collectionsThisWeek: number;
  collectionsThisMonth: number;
  collectionsThisYear: number;
  location: string;
  timestamp?: string | number;
  weight?: number;
  gps?: string;
}

// Mock data removed - using real data from APIs and real-time monitoring


export function AnalyticsTab() {
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("week");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  const { wasteBins } = useRealTimeData();

  // Convert timeFilter to the format expected by useAnalytics
  const analyticsTimeFilter = timeFilter === "week" ? "This Week" : 
                             timeFilter === "month" ? "This Month" : "This Year";
  
  // Use the analytics hook
  const { 
    analyticsData, 
    isLoading: isLoadingAnalytics, 
    error: analyticsError,
    criticalBins: criticalBinsData 
  } = useAnalytics(analyticsTimeFilter);

  // Helper function to safely cast status
  const getSafeStatus = (status: string): "normal" | "warning" | "critical" => {
    if (status === "warning" || status === "critical") {
      return status;
    }
    return "normal";
  };

  // Use analytics data directly (no fallback needed as APIs return real data)
  const displayData = analyticsData || {
    weeklyCollections: 0,
    monthlyCollections: 0,
    yearlyCollections: 0,
    averageFillLevel: 0,
    criticalBins: 0,
    routeEfficiency: 0,
  };

  // Create bin data from real-time monitoring and critical bins
  const realBinData: BinData[] = [];
  
  // Add real-time bins
  wasteBins.forEach((bin) => {
    realBinData.push({
      id: bin.id,
      route: `Route - ${bin.location}`,
      lastCollection: bin.lastCollected || "N/A",
      fillLevel: bin.level || 0,
      status: bin.status || "normal",
      collectionsThisWeek: 0, // Will be calculated from activity logs
      collectionsThisMonth: 0,
      collectionsThisYear: 0,
      location: bin.location || "Unknown",
      timestamp: bin.binData?.timestamp || new Date().getTime(),
      weight: bin.binData?.weight_kg || 0,
      gps: bin.binData ? `${bin.binData.latitude}, ${bin.binData.longitude}` : "N/A",
    });
  });

  // Add critical bins from bin history
  criticalBinsData?.forEach((criticalBin) => {
    // Check if this bin is already in real-time data
    const existingBin = realBinData.find(bin => bin.id === criticalBin.id);
    if (existingBin) {
      // Update existing bin with critical data
      existingBin.fillLevel = criticalBin.bin_level;
      existingBin.status = getSafeStatus(criticalBin.status);
    } else {
      // Add new critical bin
      realBinData.push({
        id: criticalBin.id,
        route: `Route - ${criticalBin.location}`,
        lastCollection: "N/A",
        fillLevel: criticalBin.bin_level,
        status: getSafeStatus(criticalBin.status),
        collectionsThisWeek: 0,
        collectionsThisMonth: 0,
        collectionsThisYear: 0,
        location: criticalBin.location,
        timestamp: criticalBin.timestamp || new Date().getTime(),
        weight: 0,
        gps: "N/A",
      });
    }
  });

  const filteredData = realBinData.filter(
    (bin) => routeFilter === "all" || bin.route.includes(routeFilter)
  );

  // Use analytics data from the hook instead of calculating from mock data
  const totalCollections = timeFilter === "week" ? displayData.weeklyCollections :
                          timeFilter === "month" ? displayData.monthlyCollections :
                          displayData.yearlyCollections;

  const averageFillLevel = displayData.averageFillLevel;
  const criticalBins = displayData.criticalBins;
  const routeEfficiency = displayData.routeEfficiency;

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

  // Helper function to format timestamps in a readable way
  const formatTimestamp = (timestamp: string | number | undefined): string => {
    if (!timestamp) return "N/A";
    
    try {
      let date: Date;
      
      // Handle different timestamp formats
      if (typeof timestamp === 'number') {
        // Unix timestamp (seconds or milliseconds)
        date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return "N/A";
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      // Format as readable date and time
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      // If less than 24 hours, show relative time
      if (diffInHours < 24) {
        if (diffInHours < 1) {
          const minutes = Math.floor(diffInHours * 60);
          return `${minutes}m ago`;
        } else {
          const hours = Math.floor(diffInHours);
          return `${hours}h ago`;
        }
      }
      
      // If more than 24 hours, show date and time
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Helper function to get full timestamp for tooltip
  const getFullTimestamp = (timestamp: string | number | undefined): string => {
    if (!timestamp) return "N/A";
    
    try {
      let date: Date;
      
      if (typeof timestamp === 'number') {
        date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        return "N/A";
      }
      
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Timestamp component with tooltip
  const TimestampDisplay = ({ timestamp }: { timestamp: string | number | undefined }) => {
    const formatted = formatTimestamp(timestamp);
    const fullTimestamp = getFullTimestamp(timestamp);
    
    if (formatted === "N/A" || formatted === "Invalid Date") {
      return <span className="text-gray-500">{formatted}</span>;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help text-blue-600 hover:text-blue-800">
              {formatted}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{fullTimestamp}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Show error notification if there's an error, but don't block the UI
  const showErrorNotification = analyticsError && (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Using fallback data - Analytics API unavailable</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {showErrorNotification}
      
      <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Waste Analytics & Reports
      </h2>
        {isLoadingAnalytics && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        )}
      </div>

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
            <span className="text-2xl font-bold">{routeEfficiency}%</span>
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
                {Array.from(new Set(realBinData.map(bin => bin.route.split(' - ')[0])))
                  .filter(route => route && route !== 'Route')
                  .map(route => (
                    <SelectItem key={route} value={route}>{route}</SelectItem>
                  ))}
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
                {filteredData.length > 0 ? (
                  filteredData.map((bin) => (
                  <TableRow key={bin.id}>
                    <TableCell className="text-center font-medium">{bin.id}</TableCell>
                    <TableCell className="text-center">{bin.route}</TableCell>
                      <TableCell className="text-center text-sm">
                        <TimestampDisplay timestamp={bin.timestamp} />
                      </TableCell>
                      <TableCell className="text-center">{bin.weight ?? 0} kg</TableCell>
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
                      <TableCell className="text-center text-sm">{bin.gps ?? "N/A"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(bin.status)}>{bin.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        <TimestampDisplay timestamp={bin.lastCollection} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No bin data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
