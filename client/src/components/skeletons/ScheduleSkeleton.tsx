import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ScheduleSkeleton = () => {
  return (
    <div>
      <Card className="w-full border-transparent">
        <CardHeader className="pb-4 pt-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Schedules</CardTitle>
            </div>
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </CardHeader>

        <CardContent className="p-3">
          {/* Calendar Skeleton */}
          <div className="w-full rounded-md border bg-white dark:bg-gray-900">
            {/* Calendar Header */}
            <div className="flex justify-center pt-2 relative items-center mb-4">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-32 mx-8" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>

            {/* Calendar Days Header */}
            <div className="flex w-full border-b pb-2 mb-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex-1 text-center py-2">
                  <Skeleton className="h-3 w-8 mx-auto" />
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex w-full">
                  {Array.from({ length: 7 }).map((_, dayIndex) => (
                    <div key={dayIndex} className="flex-1 text-center p-1 relative border border-gray-100 min-h-[100px]">
                      <div className="w-full h-full p-1 flex items-center justify-center min-h-[80px] rounded-md">
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
