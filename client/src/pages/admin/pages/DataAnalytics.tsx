import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, AlertTriangle, Route } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function DataAnalytics() {
  const [timeFilter, setTimeFilter] = useState("This Week");
  const { analyticsData, isLoading, error } = useAnalytics(timeFilter);

  const timeFilterOptions = [
    { value: "This Week", label: "This Week" },
    { value: "This Month", label: "This Month" },
    { value: "This Year", label: "This Year" }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Waste Analytics & Reports</h2>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Collections */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {timeFilter === "This Week" ? "Weekly Collections" : 
                   timeFilter === "This Month" ? "Monthly Collections" : 
                   "Yearly Collections"}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? "..." : (
                    timeFilter === "This Week" ? (analyticsData.weeklyCollections || 0) :
                    timeFilter === "This Month" ? (analyticsData.monthlyCollections || 0) :
                    (analyticsData.yearlyCollections || 0)
                  )}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        {/* Average Fill Level */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Fill Level</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? "..." : `${analyticsData.averageFillLevel || 0}%`}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Critical Bins */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Bins</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? "..." : (analyticsData.criticalBins || 0)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* Route Efficiency */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Route Efficiency</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? "..." : `${analyticsData.routeEfficiency || 0}%`}
                </p>
              </div>
              <Route className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Debug Info:</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>Time Filter: {timeFilter}</p>
              <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>Data: {JSON.stringify(analyticsData, null, 2)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Error loading analytics data: {error.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
