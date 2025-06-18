
import { WasteLevelCards } from "../admin/pages/WasteLevelCards";
import { DataAnalytics } from "../admin/pages/DataAnalytics";
import { MapSection } from "../admin/pages/MapSection";
export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
        <p className="text-gray-600">Get a quick overview of your waste management system.</p>
      </div>
      
      <WasteLevelCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MapSection />
        <DataAnalytics />
      </div>
    </div>
  );
}