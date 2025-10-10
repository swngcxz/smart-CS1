import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

export default function StaffTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell>
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </TableCell>
          <TableCell>
            <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </TableCell>
          <TableCell>
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
