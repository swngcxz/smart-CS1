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
      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
            Error loading activity overview: {error}
          </p>
        </div>
      )}
      
      {/* Inline cards - spread out */}
      <div className="flex justify-between gap-4">
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-200 rounded-full px-4 py-2 flex-1"
          >
            <div className="flex items-center gap-2">
              {getIcon(card.label)}
              <div className="flex flex-col">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {card.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${getCardColor(card.label)}`}>
                {loading ? "..." : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
