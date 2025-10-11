import React from "react";

export default function PerformanceTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-4 py-4 text-center">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div>
          </td>
          <td className="px-4 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
          </td>
          <td className="px-4 py-4 text-center">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto"></div>
          </td>
          <td className="px-4 py-4 text-center">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
          </td>
          <td className="px-4 py-4 text-center">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
          </td>
        </tr>
      ))}
    </>
  );
}
