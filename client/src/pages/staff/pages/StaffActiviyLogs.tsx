import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  User,
} from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
type SortField = "timestamp" | "activity_type" | "status" | "priority";
type SortDirection = "asc" | "desc";
import StaffActivityLogsSkeleton from "@/components/skeletons/StaffActivityLogsSkeleton";
export function StaffActivityLogs() {
  // Get userId from auth context
  const { user: authUser } = useAuth();
  const userId = authUser?.id;

  const { logs, user, loading, error, refetch } = useActivityLogs(userId); // No auto-refresh, only manual refresh

  // Filter and sort states
  const [activityType, setActivityType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    task_note: "",
    assigned_janitor_id: "",
    assigned_janitor_name: "",
    status: "",
    priority: "",
  });

  // Assignment modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningActivity, setAssigningActivity] = useState<any>(null);
  const [selectedJanitorId, setSelectedJanitorId] = useState("");

  // Mock staff list - in real app, this would come from an API
  const staffList = [
    { id: "E5299pi1fFCIKVzwAhGq", name: "Jeralyn Peritos" },
    { id: "6uprP4efGeffBN5aEJGx", name: "Glendon Rose Marie" },
    { id: "s0raQJrggtUexsLkUqgZ", name: "John Dave Laparan" },
  ];

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "Task_assignment":
        return "bg-blue-100 text-blue-800 orange:bg-blue-900 orange:text-blue-200";
      case "Bin_emptied":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Route_change":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Schedule_update":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "Bin_alert":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Inprogress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Done":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Utility function to parse various timestamp formats
  const parseTimestamp = (timestamp: string): Date | null => {
    if (!timestamp || timestamp === "Invalid Date" || timestamp === "null" || timestamp === "undefined") {
      return null;
    }

    // Try different timestamp formats
    let date = new Date(timestamp);

    // If the first attempt fails, try parsing as ISO string or Unix timestamp
    if (isNaN(date.getTime())) {
      // Try as Unix timestamp (seconds or milliseconds)
      const numTimestamp = Number(timestamp);
      if (!isNaN(numTimestamp)) {
        // If it's a Unix timestamp in seconds, convert to milliseconds
        date = new Date(numTimestamp > 1000000000000 ? numTimestamp : numTimestamp * 1000);
      } else {
        // Try parsing with different formats
        date = new Date(timestamp.replace(" ", "T")); // Handle space instead of T
      }
    }

    return isNaN(date.getTime()) ? null : date;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = parseTimestamp(timestamp);
    if (!date) return "N/A";
    return date.toLocaleString();
  };

  const formatDisplayDate = (timestamp: string) => {
    const date = parseTimestamp(timestamp);
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDisplayTime = (timestamp: string) => {
    const date = parseTimestamp(timestamp);
    if (!date) return "N/A";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Edit and Delete handlers
  const handleEditActivity = (activity: any) => {
    setEditingActivity(activity);
    setEditFormData({
      task_note: activity.task_note || "",
      assigned_janitor_id: activity.assigned_janitor_id || "",
      assigned_janitor_name: activity.assigned_janitor_name || "",
      status: activity.status || "",
      priority: activity.priority || "",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingActivity) return;

    try {
      // Update the assigned janitor name based on selected ID
      const selectedStaff = staffList.find((staff) => staff.id === editFormData.assigned_janitor_id);

      // Determine the final status based on assignment logic
      let newStatus = editFormData.status;

      // If janitor is being assigned and task was pending/unassigned
      if (
        editFormData.assigned_janitor_id &&
        (editingActivity.status === "pending" || !editingActivity.assigned_janitor_id)
      ) {
        newStatus = "in_progress";
      }
      // If janitor is being unassigned and task was in_progress
      else if (
        !editFormData.assigned_janitor_id &&
        editingActivity.assigned_janitor_id &&
        editingActivity.status === "in_progress"
      ) {
        newStatus = "pending";
      }

      const updatedData = {
        task_note: editFormData.task_note,
        assigned_janitor_id: editFormData.assigned_janitor_id || null,
        assigned_janitor_name: editFormData.assigned_janitor_id
          ? selectedStaff?.name || editFormData.assigned_janitor_name || null
          : null,
        status: newStatus,
        priority: editFormData.priority,
      };

      // Call API to update the activity
      await api.put(`/api/activitylogs/${editingActivity.id}`, updatedData);

      // Close the modal and refresh
      setEditModalOpen(false);
      setEditingActivity(null);
      refetch(); // Refresh the data

      alert("Activity updated successfully!");
    } catch (error) {
      console.error("Error updating activity:", error);
      alert("Error updating activity. Please try again.");
    }
  };

  // Assignment handlers
  const handleAssignClick = (activity: any) => {
    setAssigningActivity(activity);
    setSelectedJanitorId("");
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!assigningActivity || !selectedJanitorId) return;

    try {
      const selectedStaff = staffList.find((staff) => staff.id === selectedJanitorId);

      const updatedData = {
        assigned_janitor_id: selectedJanitorId,
        assigned_janitor_name: selectedStaff?.name || "",
        status: "in_progress", // Automatically change to in_progress when assigned
      };

      // Call API to assign the task
      await api.put(`/api/activity-logs/${assigningActivity.id}/assign`, updatedData);

      // Close the modal and refresh
      setAssignModalOpen(false);
      setAssigningActivity(null);
      setSelectedJanitorId("");
      refetch(); // Refresh the data

      alert("Janitor assigned successfully!");
    } catch (error) {
      console.error("Error assigning janitor:", error);
      alert("Error assigning janitor. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
      return;
    }

    try {
      // Call API to delete the activity
      await api.delete(`/api/activitylogs/${activityId}`);

      // Refresh the data
      refetch();

      alert("Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Error deleting activity. Please try again.");
    }
  };

  const formatActivityDescription = (activity: any) => {
    if (activity.bin_id && activity.bin_location) {
      return `Bin ${activity.bin_id} at ${activity.bin_location}`;
    }
    if (activity.task_note) {
      return activity.task_note;
    }
    return activity.activity_type || "Activity logged";
  };

  // Filter and sort logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply filters
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "timestamp":
          const aDate = parseTimestamp(a.timestamp);
          const bDate = parseTimestamp(b.timestamp);
          aValue = aDate ? aDate.getTime() : 0;
          bValue = bDate ? bDate.getTime() : 0;
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
  }, [logs, activityType, statusFilter, priorityFilter, searchTerm, sortField, sortDirection]);

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
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">
                {filteredAndSortedLogs.length} of {logs?.length || 0} logs
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 ml-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <SelectItem value="bin_emptied">Trash Collection</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
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
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <StaffActivityLogsSkeleton />
          ) : error ? (
            <div className="text-center py-8 text-red-500 dark:text-red-400">
              {error}
              <button onClick={refetch} className="ml-2 text-blue-500 hover:text-blue-700 underline">
                Retry
              </button>
            </div>
          ) : filteredAndSortedLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {logs.length === 0 ? "No activities to display" : "No activities match your filters"}
              <div className="text-xs mt-2">
                {logs.length === 0 ? "Check if data exists in database" : "Try adjusting your filters"}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <Table className="min-w-[800px] table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[12%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("timestamp")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
                        >
                          Date & Time {getSortIcon("timestamp")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[10%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("activity_type")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
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
                          onClick={() => handleSort("priority")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
                        >
                          Priority {getSortIcon("priority")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[10%]">Details</TableHead>
                      <TableHead className="w-[8%]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("status")}
                          className="flex items-center gap-1 p-0 h-auto font-semibold text-left w-full justify-start hover:bg-slate-100/50 dark:hover:bg-slate-700/30"
                        >
                          Status {getSortIcon("status")}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[10%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedLogs.map((activity) => (
                      <TableRow
                        key={activity.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors duration-200 cursor-pointer group border-b border-gray-100 dark:border-gray-700"
                        title={`Click to view details for ${activity.activity_type || "activity"}`}
                      >
                        <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="font-semibold text-sm leading-tight text-gray-800 dark:text-gray-100">
                              {activity.formatted_date || formatDisplayDate(activity.timestamp)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                              {activity.formatted_time || formatDisplayTime(activity.timestamp)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            className={`${getActivityTypeColor(
                              activity.activity_type || "Unknown"
                            )} text-xs px-3 py-1 font-medium`}
                            title={`Activity Type: ${activity.activity_type || "Unknown"}`}
                          >
                            {activity.activity_type || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-2">
                            <div
                              className="font-medium text-sm leading-tight text-gray-800 dark:text-gray-100"
                              title={formatActivityDescription(activity)}
                            >
                              {formatActivityDescription(activity)}
                            </div>
                            {activity.task_note && (
                              <div
                                className="text-xs text-gray-600 dark:text-gray-400 italic leading-tight bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded"
                                title={activity.task_note}
                              >
                                <span className="font-medium text-gray-700 dark:text-gray-300">Note:</span>{" "}
                                {activity.task_note}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {activity.assigned_janitor_name && activity.assigned_janitor_name.trim() !== "" ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <div
                                className="font-medium text-sm"
                                title={`Assigned to: ${activity.assigned_janitor_name}`}
                              >
                                {activity.assigned_janitor_name}
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                              onClick={() => handleAssignJanitor(activity)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Assign
                            </Button>
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
                                {/* <span className="font-medium"></span> {activity.bin_id} */}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            className={`${getPriorityColor(activity.priority)} text-xs px-3 py-1 font-medium`}
                            title={`Priority: ${activity.display_priority || activity.priority || "Low"}`}
                          >
                            {activity.display_priority || activity.priority || "Low"}
                          </Badge>
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
                            {activity.status_notes && (
                              <div className="text-gray-500 italic text-xs leading-tight" title={activity.status_notes}>
                                <span className="font-medium">Note:</span> {activity.status_notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge
                            className={`${getStatusColor(
                              activity.status
                            )} text-xs px-3 py-1 font-medium transition-all duration-200`}
                            title={`Status: ${activity.display_status || activity.status || "Pending"}`}
                          >
                            {activity.display_status || activity.status || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditActivity(activity)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteActivity(activity.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer"
                    title={`Click to view details for ${activity.activity_type || "activity"}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`${getActivityTypeColor(activity.activity_type || "unknown")} text-xs px-2 py-1`}
                          >
                            {activity.activity_type?.replace("_", " ") || "unknown"}
                          </Badge>
                          <Badge className={`${getPriorityColor(activity.priority)} text-xs px-2 py-1`}>
                            {activity.display_priority || activity.priority || "Low"}
                          </Badge>
                          <Badge className={`${getStatusColor(activity.status)} text-xs px-2 py-1`}>
                            {activity.display_status || activity.status || "Pending"}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {formatActivityDescription(activity)}
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
                          {activity.formatted_date || formatDisplayDate(activity.timestamp)}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {activity.formatted_time || formatDisplayTime(activity.timestamp)}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Assigned To:</span>
                        <div className="text-gray-900 dark:text-white">
                          {activity.assigned_janitor_name && activity.assigned_janitor_name.trim() !== "" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{activity.assigned_janitor_name}</span>
                            </div>
                          ) : activity.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignClick(activity)}
                              className="text-xs border-gray-300 hover:bg-gray-50"
                            >
                              Assign To
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Location:</span>
                        <div className="text-gray-900 dark:text-white">{activity.bin_location || "Unknown"}</div>
                        {activity.bin_id && (
                          <div className="text-gray-500 dark:text-gray-400">Bin: {activity.bin_id}</div>
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Janitor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Select a janitor to assign to this task:</p>
              {assigningActivity && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium text-sm">{assigningActivity.task_note || "Task assignment"}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {assigningActivity.bin_location} • {assigningActivity.activity_type}
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="janitor_select">Select Janitor</Label>
              <Select value={selectedJanitorId} onValueChange={setSelectedJanitorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a janitor..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {staff.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Assigning a janitor will automatically change the status to "In Progress"
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAssignment}
              disabled={!selectedJanitorId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Assign Janitor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task_note">Description / Task Note</Label>
              <Textarea
                id="task_note"
                value={editFormData.task_note}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, task_note: e.target.value }))}
                placeholder="Enter task description or notes..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assigned_janitor">Assigned Janitor</Label>
              <Select
                value={editFormData.assigned_janitor_id}
                onValueChange={(value) => {
                  const selectedStaff = staffList.find((staff) => staff.id === value);

                  // Handle deselection (value === "none")
                  if (value === "none") {
                    setEditFormData((prev) => ({
                      ...prev,
                      assigned_janitor_id: "",
                      assigned_janitor_name: "",
                      // Auto-change status to pending when deselecting if currently in_progress
                      status:
                        editingActivity?.status === "in_progress" && editingActivity?.assigned_janitor_id
                          ? "pending"
                          : prev.status,
                    }));
                    return;
                  }

                  // Handle assignment
                  setEditFormData((prev) => ({
                    ...prev,
                    assigned_janitor_id: value,
                    assigned_janitor_name: selectedStaff?.name || "",
                    // Auto-change status to in_progress if assigning to pending task
                    status:
                      value && (editingActivity?.status === "pending" || !editingActivity?.assigned_janitor_id)
                        ? "in_progress"
                        : prev.status,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a janitor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">None (Unassigned)</span>
                    </div>
                  </SelectItem>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {staff.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editFormData.assigned_janitor_id &&
                (editingActivity?.status === "pending" || !editingActivity?.assigned_janitor_id) && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Status will automatically change to "In Progress" when janitor is assigned
                  </div>
                )}
              {!editFormData.assigned_janitor_id &&
                editingActivity?.assigned_janitor_id &&
                editingActivity?.status === "in_progress" && (
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Status will automatically change to "Pending" when janitor is unassigned
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editFormData.priority}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
}
