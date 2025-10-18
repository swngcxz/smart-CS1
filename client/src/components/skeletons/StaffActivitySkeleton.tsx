import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StaffActivitySkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Activity Logs Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-l font-bold text-gray-900 dark:text-white">Activity Logs</h3>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">0 of 0 Logs</div>
                <Skeleton className="h-6 w-20 rounded-md" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Search and Filters Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Skeleton className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded" />
                <Skeleton className="h-10 w-full pl-10 rounded-xl" />
              </div>
              <Skeleton className="w-full sm:w-40 h-10 rounded-xl" />
              <Skeleton className="w-full sm:w-40 h-10 rounded-xl" />
              <Skeleton className="w-full sm:w-40 h-10 rounded-xl" />
            </div>

            <div className="space-y-4">
              {/* Activity Log Items */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Skeleton className="h-10 w-10 rounded-full" />

                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-20" />
                      </div>

                      {/* Activity Description */}
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />

                      {/* Details */}
                      <div className="flex items-center gap-4 text-sm">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
