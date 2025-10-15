import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const AdminAccountSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Account Information Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Options Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          {/* Deactivate Account */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};
