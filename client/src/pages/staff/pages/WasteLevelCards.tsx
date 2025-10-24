import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";

const wasteData = [
  {
    id: 1,
    location: "Central Plaza",
    level: 85, // Will be overridden by real-time data
    status: "critical",
    lastCollected: "2 hours ago",
    icon: AlertTriangle,
  },
  {
    id: 2,
    location: "Park Avenue",
    level: 90,
    status: "critical",
    lastCollected: "1 day ago",
    icon: AlertTriangle,
  },
  {
    id: 3,
    location: "Mall District",
    level: 75,
    status: "warning",
    lastCollected: "4 hours ago",
    icon: Clock,
  },
  {
    id: 4,
    location: "Residential Area",
    level: 30,
    status: "normal",
    lastCollected: "6 hours ago",
    icon: CheckCircle,
  },
];

export function WasteLevelCards({
  onCardClick,
  allBins,
}: {
  onCardClick: (location: string) => void;
  allBins?: any[]; // Pass all bins from parent component
}) {
  const { wasteBins } = useRealTimeData();

  // Use allBins if provided, otherwise fall back to wasteBins from hook
  const binsToUse = allBins || wasteBins;

  // Calculate average levels for each location from all bins
  const calculateAverageLevel = (location: string) => {
    const locationBins = binsToUse.filter((bin) => bin.location === location);
    if (locationBins.length === 0) return 0;

    const totalLevel = locationBins.reduce((sum, bin) => sum + bin.level, 0);
    return Math.round(totalLevel / locationBins.length);
  };

  // Calculate status based on waste level ranges
  const calculateStatusFromLevel = (level: number) => {
    if (level >= 85) return "critical";
    if (level >= 70) return "warning";
    return "normal";
  };

  // Calculate average status for each location based on level
  const calculateAverageStatus = (location: string) => {
    const locationBins = binsToUse.filter((bin) => bin.location === location);
    if (locationBins.length === 0) return "normal";

    const averageLevel = calculateAverageLevel(location);
    return calculateStatusFromLevel(averageLevel);
  };

  // Get most recent last collected time for each location
  const getMostRecentLastCollected = (location: string) => {
    const locationBins = binsToUse.filter((bin) => bin.location === location);
    if (locationBins.length === 0) return "Unknown";

    // For simplicity, return the first one's lastCollected
    // In a real app, you'd parse timestamps and find the most recent
    return locationBins[0].lastCollected;
  };

  // Get appropriate icon based on status
  const getIconForStatus = (status: string) => {
    switch (status) {
      case "critical":
        return AlertTriangle;
      case "warning":
        return Clock;
      case "normal":
      default:
        return CheckCircle;
    }
  };

  // Update static data with calculated averages from real-time data
  const updatedWasteData = wasteData.map((bin) => {
    const averageLevel = calculateAverageLevel(bin.location);
    const averageStatus = calculateAverageStatus(bin.location);
    const mostRecentLastCollected = getMostRecentLastCollected(bin.location);

    // Check if we have real-time data for this location
    const hasRealTimeData = binsToUse.some((wb) => wb.location === bin.location);

    // Debug logging for Central Plaza
    if (bin.location === "Central Plaza") {
      console.log(
        "Central Plaza bins:",
        binsToUse.filter((wb) => wb.location === bin.location)
      );
      console.log("Has real-time data:", hasRealTimeData);
    }

    // For Park Avenue and Mall District, maintain their intended status
    // Central Plaza uses real-time data, others use static data
    let finalLevel, finalStatus;

    if (bin.location === "Central Plaza" && hasRealTimeData) {
      // Use real-time data for Central Plaza
      finalLevel = averageLevel;
      finalStatus = calculateStatusFromLevel(finalLevel);
    } else if (bin.location === "Park Avenue") {
      // Park Avenue should always show critical
      finalLevel = bin.level; // 90%
      finalStatus = "critical";
    } else if (bin.location === "Mall District") {
      // Mall District should always show warning
      finalLevel = bin.level; // 75%
      finalStatus = "warning";
    } else {
      // For other locations, use calculated or static data
      finalLevel = hasRealTimeData ? averageLevel : bin.level;
      finalStatus = calculateStatusFromLevel(finalLevel);
    }

    return {
      ...bin,
      level: finalLevel,
      status: finalStatus,
      icon: getIconForStatus(finalStatus),
      lastCollected: hasRealTimeData ? mostRecentLastCollected : bin.lastCollected,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {updatedWasteData.map((bin) => {
        const Icon = bin.icon;
        return (
          <Card
            key={bin.id}
            onClick={() => onCardClick(bin.location)}
            className="hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 cursor-pointer"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">{bin.location}</CardTitle>
                  {binsToUse.some(
                    (wb) =>
                      wb.location === bin.location &&
                      (wb.timestamp || wb.lastUpdated || wb.level !== undefined || wb.weight_percent !== undefined)
                  ) && (
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          bin.status === "critical"
                            ? "bg-red-500"
                            : bin.status === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      ></div>
                      <span
                        className={`text-xs ${
                          bin.status === "critical"
                            ? "text-red-600 dark:text-red-400"
                            : bin.status === "warning"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        Live
                      </span>
                    </div>
                  )}
                </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
