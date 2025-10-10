import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const FeedbackListSkeleton = () => {
  return (
    <Card className="border-transparent shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          {/* Left title */}
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">Active Feedback</CardTitle>

          {/* Right buttons + avg rating — fully visible (not skeleton) */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <Button
                variant="default"
                size="sm"
                className="text-xs px-3 py-1 h-auto bg-gray-100 text-gray-900 hover:bg-gray-200"
              >
                All (0)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs px-3 py-1 h-auto text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                New (0)
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">Avg Rating:</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-yellow-600">0.0</span>
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="w-3 h-3 text-gray-300" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Table-style feedback skeletons */}
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all animate-pulse"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 space-y-2">
                  {/* Title + badge */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>

                  {/* Content lines */}
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mt-3"></div>
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 ml-4">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackListSkeleton;
