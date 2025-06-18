import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export function DataAnalytics() {
  return (
    <Card className="h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Waste Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Today's Collection</p>
              <p className="text-2xl font-bold text-blue-600">24 tons</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Organic Waste</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "45%" }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Recyclable</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">35%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "35%" }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">General Waste</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">20%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gray-500 h-2 rounded-full" style={{ width: "20%" }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
