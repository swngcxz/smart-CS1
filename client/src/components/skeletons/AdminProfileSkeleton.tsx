import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Profile Picture Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <div className="group relative">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="absolute top-2 right-2 h-6 w-6 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
