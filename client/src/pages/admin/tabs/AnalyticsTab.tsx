import { DataAnalytics } from "../pages/DataAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics & Reports</h2>
        <p className="text-gray-600 dark:text-gray-400">Analyze waste collection data and trends over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">324</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Waste Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">1.2T</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+8%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <span className="text-2xl font-bold">$2.4K</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600">-15%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Efficiency</CardTitle>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataAnalytics />

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <DollarSign className="w-5 h-5 text-green-600" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Fuel Costs", value: "$1,240", progress: 45 },
              { label: "Maintenance", value: "$890", progress: 32 },
              { label: "Staff Costs", value: "$2,100", progress: 75 },
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">Total Monthly Cost</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">$4,230</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
