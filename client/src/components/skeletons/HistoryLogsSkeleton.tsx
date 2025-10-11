import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const HistoryLogsSkeleton = () => {
  return (
    <div className="space-y-6 p-4 sm:p-2">
      {/* Section Title Skeleton */}
      <Skeleton className="h-8 w-48" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active History Logs Card */}
        <Card className="transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>

        {/* Total History Logs Card */}
        <Card className="transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>

        {/* Avg Session Duration Card */}
        <Card className="transition-all hover:shadow-md sm:col-span-2 lg:col-span-1 dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="bg-transparent border-0 shadow-none p-0">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>

        <div className="space-y-4">
          {/* Filter Controls Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 dark:bg-gray-900 dark:border-gray-700">
            <div className="relative flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Skeleton className="h-10 w-full sm:w-40" />
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
            <Skeleton className="h-10 w-10" />
          </div>

          {/* Mobile Card View Skeleton */}
          <div className="block sm:hidden space-y-4 dark:bg-gray-900 dark:border-gray-700">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-l-4 border-l-gray-300">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View Skeleton */}
          <div className="hidden sm:block overflow-x-auto dark:bg-gray-900 dark:border-gray-700">
            <div className="border rounded-lg">
              {/* Table Header */}
              <div className="border-b bg-gray-50 dark:bg-gray-800 p-4">
                <div className="grid grid-cols-7 gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>

              {/* Table Rows */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border-b p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="grid grid-cols-7 gap-4 items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-20 font-mono text-xs" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
