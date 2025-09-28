import { WasteLevelCards } from "../../staff/pages/WasteLevelCards";
import { DataAnalytics } from "../pages/DataAnalytics";
import { MapSection } from "../pages/MapSection";
import { useRealTimeData } from "@/hooks/useRealTimeData";

export function DashboardOverview() {
  const { wasteBins, loading, error } = useRealTimeData();

  const handleCardClick = (location: string) => {
    console.log(`Admin clicked on ${location} - Navigate to detailed view`);
    // You can implement navigation to detailed view here
  };

  return (
    <div className="space-y-6 bg-background dark:bg-gray-900 text-gray-900 dark:text-white ">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Get a quick overview of your waste management system.</p>
      </div>

      <DataAnalytics />
    </div>
  );
}
