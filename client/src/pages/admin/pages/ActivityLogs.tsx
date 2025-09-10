import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAllActivityLogs } from "@/hooks/useActivityLogsApi";
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Calendar, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ActivityLogsProps {
  onRefresh?: () => void;
}

type SortField = 'timestamp' | 'activity_type' | 'status' | 'priority';
type SortDirection = 'asc' | 'desc';

export function ActivityLogs({ onRefresh }: ActivityLogsProps) {
  const [activityType, setActivityType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const { logs, loading, error, totalCount } = useAllActivityLogs(100, 0, activityType !== "all" ? activityType : undefined);

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

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply filters
    if (activityType && activityType !== "all") {
      filtered = filtered.filter(log => log.activity_type === activityType);
    }
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(log => log.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter(log => log.priority?.toLowerCase() === priorityFilter.toLowerCase());
    }
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
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
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= filterDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'activity_type':
          aValue = a.activity_type || '';
          bValue = b.activity_type || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'priority':
          aValue = a.priority || '';
          bValue = b.priority || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [logs, activityType, statusFilter, priorityFilter, searchTerm, dateRange, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const clearFilters = () => {
    setActivityType("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateRange("all");
    setSearchTerm("");
    setSortField('timestamp');
    setSortDirection('desc');
  };

  return (
    <ErrorBoundary>
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            Activity Logs
          </CardTitle>
          <div className="flex items-center ml-auto space-x-2">
            <Badge variant="secondary">
              {filteredAndSortedLogs.length} of {totalCount} Logs
            </Badge>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="text-black-600 hover:text-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

        </div>

        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Activity Type */}
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task_assignment">Task Assignment</SelectItem>
                <SelectItem value="bin_emptied">Bin Emptied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="login">Login</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(activityType !== "all" || statusFilter !== "all" || priorityFilter !== "all" || dateRange !== "all" || searchTerm) && (
            <div className="flex justify-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                Clear All Filters
              </Button>
            </div>
          )}
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
            <div className="text-xs mt-2">
              {logs.length === 0 ? "Check if data exists in database" : "Try adjusting your filters"}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[12%]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('timestamp')}
                        className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Date & Time {getSortIcon('timestamp')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[10%]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('activity_type')}
                        className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Activity Type {getSortIcon('activity_type')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[25%]">Description</TableHead>
                    <TableHead className="w-[12%]">Assigned To</TableHead>
                    <TableHead className="w-[15%]">Location</TableHead>
                    <TableHead className="w-[8%]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[8%]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('priority')}
                        className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Priority {getSortIcon('priority')}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[10%]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedLogs.map((activity) => (
                    <TableRow 
                      key={activity.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer group"
                      title={`Click to view details for ${activity.activity_type || 'activity'}`}
                    >
                      <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm leading-tight">
                            {formatTimestamp(activity.timestamp).split(',')[0]}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {formatTimestamp(activity.timestamp).split(',')[1]?.trim()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge 
                          className={`${getActivityTypeColor(activity.activity_type || "unknown")} text-xs px-2 py-1 transition-all duration-200 group-hover:scale-105`}
                          title={`Activity Type: ${activity.activity_type || "unknown"}`}
                        >
                          {activity.activity_type || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          {activity.bin_id && (
                            <div className="font-medium text-sm leading-tight" title={`Bin: ${activity.bin_id} — ${activity.bin_location || "Unknown Location"}`}>
                              Bin: {activity.bin_id} — {activity.bin_location || "Unknown Location"}
                            </div>
                          )}
                          {activity.task_note && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 italic leading-tight" title={activity.task_note}>
                              <span className="font-medium">Note:</span> {activity.task_note}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {activity.assigned_janitor_name ? (
                          <div className="font-medium text-sm" title={`Assigned to: ${activity.assigned_janitor_name}`}>
                            {activity.assigned_janitor_name}
                          </div>
                        ) : activity.user_id ? (
                          <div className="font-medium text-sm" title={`User: ${activity.user_id}`}>
                            {activity.user_id}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic text-sm">Unassigned</div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          {activity.bin_location && (
                            <div className="font-medium text-sm leading-tight" title={activity.bin_location}>
                              {activity.bin_location}
                            </div>
                          )}
                          {activity.bin_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                              <span className="font-medium">Bin:</span> {activity.bin_id}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {activity.status && (
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-1 transition-all duration-200 group-hover:scale-105"
                            title={`Status: ${activity.status}`}
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {activity.priority && (
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-1 transition-all duration-200 group-hover:scale-105"
                            title={`Priority: ${activity.priority}`}
                          >
                            {activity.priority}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                        <div className="space-y-1">
                          {activity.bin_level !== undefined && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              <span className="font-medium">Level: {activity.bin_level}%</span>
                            </div>
                          )}
                          {activity.bin_status && activity.bin_status !== activity.status && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="font-medium">Bin: {activity.bin_status}</span>
                            </div>
                          )}
                          {activity.user_id && !activity.assigned_janitor_name && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="font-medium">User: {activity.user_id}</span>
                            </div>
                          )}
                          {activity.task_note && (
                            <div className="text-gray-500 italic text-xs leading-tight" title={activity.task_note}>
                              <span className="font-medium">Note:</span> {activity.task_note}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredAndSortedLogs.map((activity) => (
              <div
                key={activity.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  title={`Click to view details for ${activity.activity_type || 'activity'}`}
              >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          className={`${getActivityTypeColor(activity.activity_type || "unknown")} text-xs px-2 py-1`}
                        >
                      {activity.activity_type || "unknown"}
                    </Badge>
                        {activity.status && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {activity.status}
                          </Badge>
                        )}
                        {activity.priority && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {activity.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {activity.bin_id && `Bin: ${activity.bin_id} — ${activity.bin_location || "Unknown Location"}`}
                      </div>
                      {activity.task_note && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                          <span className="font-medium">Note:</span> {activity.task_note}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Date & Time:</span>
                      <div className="text-gray-900 dark:text-white">
                        {formatTimestamp(activity.timestamp).split(',')[0]}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {formatTimestamp(activity.timestamp).split(',')[1]?.trim()}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Assigned To:</span>
                      <div className="text-gray-900 dark:text-white">
                        {activity.assigned_janitor_name || activity.user_id || "Unassigned"}
                      </div>
                  </div>
                  
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Location:</span>
                      <div className="text-gray-900 dark:text-white">
                        {activity.bin_location || "Unknown"}
                      </div>
                  {activity.bin_id && (
                        <div className="text-gray-500 dark:text-gray-400">
                          Bin: {activity.bin_id}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Details:</span>
                      {activity.bin_level !== undefined && (
                        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          Level: {activity.bin_level}%
                        </div>
                      )}
                      {activity.bin_status && activity.bin_status !== activity.status && (
                        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          Bin: {activity.bin_status}
                        </div>
                      )}
                      {activity.user_id && !activity.assigned_janitor_name && (
                        <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          User: {activity.user_id}
                        </div>
                    )}
                  </div>
                </div>
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