import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ActivityLogsSkeleton() {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-gray-200 dark:border-gray-700">
            <TableHead className="text-gray-900 dark:text-white font-semibold w-32">Date & Time</TableHead>
            <TableHead className="text-gray-900 dark:text-white font-semibold w-64">Description</TableHead>
            <TableHead className="text-gray-900 dark:text-white font-semibold w-32">Assigned To</TableHead>
            <TableHead className="text-gray-900 dark:text-white font-semibold w-24">Location</TableHead>
            <TableHead className="text-gray-900 dark:text-white font-semibold w-20">Status</TableHead>
            <TableHead className="text-gray-900 dark:text-white font-semibold w-20">Priority</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 6 }).map((_, index) => (
            <TableRow key={index} className="border-gray-100 dark:border-gray-800">
              {/* Date & Time */}
              <TableCell className="w-32">
                <div className="space-y-1">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </TableCell>

              {/* Description */}
              <TableCell className="w-64">
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </TableCell>

              {/* Assigned To */}
              <TableCell className="w-32">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </TableCell>

              {/* Location */}
              <TableCell className="w-24">
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </TableCell>

              {/* Status */}
              <TableCell className="w-20">
                <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </TableCell>

              {/* Priority */}
              <TableCell className="w-20">
                <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
