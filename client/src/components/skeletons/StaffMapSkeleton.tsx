import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StaffMapSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Section - Keep title real, skeleton status indicators */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Map View</h2>
        <div className="flex items-center gap-3 text-xs">
          {/* Status Indicators Skeleton */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

            <div className="flex items-center gap-1">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

            <div className="flex items-center gap-1">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full pb-10">
        <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Location Display - Keep real */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold">Naga City, Cebu</h3>
            </div>
          </div>

          {/* Map Skeleton */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Skeleton className="h-12 w-12 mx-auto rounded-full" />
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>

          {/* Map Markers Placeholders */}
          <div className="absolute top-8 left-8">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="absolute top-16 right-12">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="absolute bottom-16 left-16">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="absolute bottom-8 right-8">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
