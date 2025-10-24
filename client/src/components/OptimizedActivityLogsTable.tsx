import React from "react";
import { ActivityLogsTable } from "./ActivityLogsTable";

interface OptimizedActivityLogsTableProps {
  userRole?: string;
  onCellClick?: (e: React.MouseEvent, activity: any) => void;
}

export function OptimizedActivityLogsTable({ 
  userRole, 
  onCellClick 
}: OptimizedActivityLogsTableProps) {
  return (
    <ActivityLogsTable
      useOptimized={true}
      userRole={userRole}
      onCellClick={onCellClick}
    />
  );
}
