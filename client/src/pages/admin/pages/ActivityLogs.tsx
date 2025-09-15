import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAllActivityLogs } from "@/hooks/useActivityLogsApi";
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ActivityLogsProps {
  onRefresh?: () => void;
}

type SortField = "timestamp" | "activity_type" | "status" | "priority";
type SortDirection = "asc" | "desc";

export function ActivityLogs({ onRefresh }: ActivityLogsProps) {
  const [activityType, setActivityType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { logs, loading, error, totalCount } = useAllActivityLogs(
    100,
    0,
    activityType !== "all" ? activityType : undefined
  );

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "task_assignment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "bin_emptied":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "login":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "done":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "urgent":
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    if (activityType && activityType !== "all") {
      filtered = filtered.filter((log) => log.activity_type === activityType);
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((log) => log.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter((log) => log.priority?.toLowerCase() === priorityFilter.toLowerCase());
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.bin_id?.toLowerCase().includes(searchLower) ||
          log.bin_location?.toLowerCase().includes(searchLower) ||
          log.task_note?.toLowerCase().includes(searchLower) ||
          log.assigned_janitor_name?.toLowerCase().includes(searchLower) ||
          log.activity_type?.toLowerCase().includes(searchLower)
      );
    }
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate >= filterDate;
      });
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortField) {
        case "timestamp":
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case "activity_type":
          aValue = a.activity_type || "";
          bValue = b.activity_type || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "priority":
          aValue = a.priority || "";
          bValue = b.priority || "";
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [logs, activityType, statusFilter, priorityFilter, searchTerm, dateRange, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const clearFilters = () => {
    setActivityType("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateRange("all");
    setSearchTerm("");
    setSortField("timestamp");
    setSortDirection("desc");
  };

  return (
    <ErrorBoundary>
      <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">Activity Logs</CardTitle>
            <div className="flex items-center ml-auto space-x-2">
              <Badge variant="secondary">
                {filteredAndSortedLogs.length} of {totalCount} Logs
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
          ) : filteredAndSortedLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {logs.length === 0 ? "No activities to display" : "No activities match your filters"}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[12%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("timestamp")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left"
                        >
                          Date & Time {getSortIcon("timestamp")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[10%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("activity_type")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left"
                        >
                          Activity Type {getSortIcon("activity_type")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[25%]">Description</TableHead>
                      <TableHead className="w-[12%]">Assigned To</TableHead>
                      <TableHead className="w-[15%]">Location</TableHead>
                      <TableHead className="w-[8%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left"
                        >
                          Status {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[8%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("priority")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left"
                        >
                          Priority {getSortIcon("priority")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[10%]">Details</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredAndSortedLogs.map((activity) => (
                      <TableRow key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${getActivityTypeColor(activity.activity_type || "unknown")} text-xs px-2 py-1`}
                          >
                            {activity.activity_type || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activity.bin_id && `${activity.bin_id} at ${activity.bin_location || "Unknown Location"}`}
                        </TableCell>
                        <TableCell>{activity.assigned_janitor_name || activity.user_id || "Unassigned"}</TableCell>
                        <TableCell>{activity.bin_location || "Unknown"}</TableCell>
                        <TableCell>
                          {activity.status && (
                            <Badge className={`${getStatusColor(activity.status)} text-xs px-2 py-1`}>
                              {activity.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {activity.priority && (
                            <Badge className={`${getPriorityColor(activity.priority)} text-xs px-2 py-1`}>
                              {activity.priority}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{activity.bin_level !== undefined && `Level: ${activity.bin_level}%`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredAndSortedLogs.map((activity) => (
                  <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`${getActivityTypeColor(activity.activity_type || "unknown")} text-xs px-2 py-1`}
                      >
                        {activity.activity_type || "unknown"}
                      </Badge>
                      {activity.status && (
                        <Badge className={`${getStatusColor(activity.status)} text-xs px-2 py-1`}>
                          {activity.status}
                        </Badge>
                      )}
                      {activity.priority && (
                        <Badge className={`${getPriorityColor(activity.priority)} text-xs px-2 py-1`}>
                          {activity.priority}
                        </Badge>
                      )}
                    </div>
                    <div>Date: {formatTimestamp(activity.timestamp)}</div>
                    <div>Assigned To: {activity.assigned_janitor_name || activity.user_id || "Unassigned"}</div>
                    <div>Location: {activity.bin_location || "Unknown"}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
