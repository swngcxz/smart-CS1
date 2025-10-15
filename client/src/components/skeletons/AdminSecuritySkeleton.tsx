import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminSecuritySkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Password Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <div className="relative">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="absolute right-2 top-2 h-6 w-6 rounded" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Confirm Password and Update Button Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="relative">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="absolute right-2 top-2 h-6 w-6 rounded" />
              </div>
            </div>
            <div className="space-y-3 flex justify-end">
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>

          {/* Password Strength Meter */}
          <div className="w-full">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-20 mt-2" />
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>

          {/* 2FA Enabled State */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-80 mb-3" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* Active Sessions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              {index === 0 ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : (
                <Skeleton className="h-8 w-16 rounded-md" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
