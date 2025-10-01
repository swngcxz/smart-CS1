import { Card, CardContent } from "@/components/ui/card";
import { ActivityOverviewCard } from "@/hooks/useActivityStats";
import { AlertTriangle, Activity, Wrench } from "lucide-react";

interface ActivityOverviewCardsProps {
  cards: ActivityOverviewCard[];
  loading?: boolean;
  error?: string | null;
}

export function ActivityOverviewCards({ cards, loading = false, error }: ActivityOverviewCardsProps) {
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "alerts":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case "in-progress":
        return <Activity className="h-6 w-6 text-yellow-500" />;
      case "collections":
        return <Activity className="h-6 w-6 text-green-500" />;
      case "maintenance":
        return <Wrench className="h-6 w-6 text-blue-500" />;
      default:
        return <Activity className="h-6 w-6 text-gray-500" />;
    }
  };

  const getCardColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "alerts":
        return "text-red-600";
      case "in-progress":
        return "text-yellow-600";
      case "collections":
        return "text-green-600";
      case "maintenance":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Overview</h2>
      
      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Error loading activity overview: {error}
          </p>
        </div>
      )}
      
      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Card 
            key={index} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {card.label}
                  </p>
                  <p className={`text-3xl font-bold ${getCardColor(card.label)} mb-1`}>
                    {loading ? "..." : card.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center">
                  {getIcon(card.label)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
