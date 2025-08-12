import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { useRealTimeData } from "@/hooks/useRealTimeData";

export function DataAnalytics() {
  const { wasteBins, loading, error } = useRealTimeData();

  // Calculate real-time statistics
  const calculateStats = () => {
    if (wasteBins.length === 0) {
      return {
        totalBins: 0,
        criticalBins: 0,
        warningBins: 0,
        normalBins: 0,
        averageLevel: 0,
        totalWeight: 0
      };
    }

    const criticalBins = wasteBins.filter(bin => bin.status === 'critical').length;
    const warningBins = wasteBins.filter(bin => bin.status === 'warning').length;
    const normalBins = wasteBins.filter(bin => bin.status === 'normal').length;
    const averageLevel = Math.round(wasteBins.reduce((sum, bin) => sum + bin.level, 0) / wasteBins.length);
    const totalWeight = wasteBins.reduce((sum, bin) => {
      return sum + (bin.binData?.weight_kg || 0);
    }, 0);

    return {
      totalBins: wasteBins.length,
      criticalBins,
      warningBins,
      normalBins,
      averageLevel,
      totalWeight: Math.round(totalWeight)
    };
  };

  const stats = calculateStats();

  return (
    <Card className="h-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          Waste Analytics
          {loading && <span className="text-sm text-gray-500">(Loading...)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-300">Error: {error}</p>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Today's Collection</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalWeight} kg</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Organic Waste</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.normalBins > 0 ? Math.round((stats.normalBins / stats.totalBins) * 100) : 45}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.normalBins > 0 ? (stats.normalBins / stats.totalBins) * 100 : 45}%` }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Recyclable</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.warningBins > 0 ? Math.round((stats.warningBins / stats.totalBins) * 100) : 35}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.warningBins > 0 ? (stats.warningBins / stats.totalBins) * 100 : 35}%` }}></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">General Waste</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.criticalBins > 0 ? Math.round((stats.criticalBins / stats.totalBins) * 100) : 20}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${stats.criticalBins > 0 ? (stats.criticalBins / stats.totalBins) * 100 : 20}%` }}></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
