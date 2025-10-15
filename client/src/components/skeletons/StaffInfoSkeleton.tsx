import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const StaffInfoSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Skeleton className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 rounded" />
            <Skeleton className="h-7 w-72 pl-7 rounded" />
          </div>
          
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-7 w-32 rounded-md" />
          </div>
          
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-7 w-36 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-4" />
          </div>
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-2">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>

            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-7 gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <div className="flex justify-center">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <div className="flex justify-center gap-1">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

