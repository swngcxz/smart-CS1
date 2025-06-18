import { DataAnalytics } from "../pages/DataAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics & Reports</h2>
        <p className="text-gray-600">Analyze waste collection data and trends over time.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">324</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+12%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Waste Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">1.2T</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+8%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">$2.4K</span>
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-600">-15%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">92%</span>
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">+5%</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataAnalytics />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Fuel Costs</span>
                <span className="text-sm font-medium">$1,240</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Maintenance</span>
                <span className="text-sm font-medium">$890</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Staff Costs</span>
                <span className="text-sm font-medium">$2,100</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total Monthly Cost</span>
                <span className="text-lg font-bold text-gray-900">$4,230</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
