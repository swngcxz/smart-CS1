import { WasteLevelCards } from "../pages/WasteLevelCards";
import { DataAnalytics } from "../pages/DataAnalytics";
import { MapSection } from "../pages/MapSection";

export function DashboardOverview() {
  return (
    <div className="space-y-6 bg-background dark:bg-gray-900 text-gray-900 dark:text-white ">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Get a quick overview of your waste management system.</p>
      </div>

      <WasteLevelCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataAnalytics />
      </div>
    </div>
  );
}
