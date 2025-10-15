import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const BinHistorySkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Status Summary Skeleton */}
      <div className="flex items-center justify-between text-sm">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-3" />
        </div>
      </div>

      {/* Filter/Search Bar Skeleton */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Data Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="border rounded-lg">
              {/* Table Header */}
              <div className="border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex">
                  <div className="flex-1 p-4 border-r">
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex-1 p-4 border-r">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex-1 p-4 border-r">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex-1 p-4 border-r">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex-1 p-4">
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>

              {/* Table Rows */}
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="border-b last:border-b-0">
                  <div className="flex items-center">
                    <div className="flex-1 p-4 border-r">
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex-1 p-4 border-r">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 border-r">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 border-r">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between p-4 border-t">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};