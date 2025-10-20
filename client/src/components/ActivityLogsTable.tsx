import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActivityLog } from "@/hooks/useActivityLogsApi";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import ActivityLogsSkeleton from "@/components/skeletons/ActivityLogsSkeleton";
interface ActivityLogsTableProps {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  userRole?: string;
  onCellClick?: (e: React.MouseEvent, activity: ActivityLog) => void;
}

export function ActivityLogsTable({ logs, loading, error, onRefresh, userRole, onCellClick }: ActivityLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [selectedJanitor, setSelectedJanitor] = useState("");
  const [janitors, setJanitors] = useState<any[]>([]);
  const [janitorsLoading, setJanitorsLoading] = useState(false);
  const [taskNotes, setTaskNotes] = useState("");
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);

  const fetchJanitors = async () => {
    setJanitorsLoading(true);
    try {
      console.log("Fetching janitors...");
      const response = await api.get("/api/janitors/available");
      console.log("Janitors response:", response.data);
      setJanitors(response.data.janitors || []);
    } catch (err) {
      console.error("Error fetching janitors:", err);
      setJanitors([]);
    } finally {
      setJanitorsLoading(false);
    }
  };

  const handleAssignClick = (activity: ActivityLog) => {
    console.log("Assign button clicked for activity:", activity);
    setSelectedActivity(activity);
    setSelectedJanitor("");
    setTaskNotes(""); // Clear task notes for user input
    setAssignModalOpen(true);
    console.log("Modal should open now");
    fetchJanitors();
  };

  const handleModalClose = () => {
    setAssignModalOpen(false);
    setSelectedActivity(null);
    setSelectedJanitor("");
    setTaskNotes(""); // Clear task notes when modal closes
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/api/activity-logs/clear-all");
      toast({
        title: "Success",
        description: "All activity logs have been cleared.",
      });
      onRefresh();
      setClearAllModalOpen(false);
    } catch (error) {
      console.error("Error clearing activity logs:", error);
      toast({
        title: "Error",
        description: "Failed to clear activity logs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedActivity || !selectedJanitor || selectedJanitor === "loading" || selectedJanitor === "no-janitors") {
      console.log("Assignment validation failed:", { selectedActivity, selectedJanitor });
      return;
    }

    try {
      console.log("Submitting assignment:", { activityId: selectedActivity.id, janitorId: selectedJanitor });
      const selectedJanitorData = janitors.find((j) => j.id === selectedJanitor);
      const janitorName = selectedJanitorData ? `${selectedJanitorData.fullName}` : "Unknown Janitor";

      const response = await api.post("/api/assign-task", {
        activityId: selectedActivity.id,
        janitorId: selectedJanitor,
        janitorName: janitorName,
        taskNote: taskNotes || "", // Use user-entered task notes
      });

      console.log("Assignment successful:", response.data);
      toast({
        title: "Task Assigned",
        description: `Task assigned to ${janitorName} successfully.`,
      });
      setAssignModalOpen(false);
      setSelectedActivity(null);
      setSelectedJanitor("");
      setTaskNotes(""); // Clear task notes
      onRefresh();
    } catch (err: any) {
      console.error("Error assigning task:", err);

      toast({
        title: "Assignment Failed",
        description: err.response?.data?.error || "Failed to assign task. Please try again.",
        variant: "destructive",
      });

      if (err.response?.status === 409 && err.response?.data?.error === "Task assignment conflict") {
        setAssignModalOpen(false);
        setSelectedActivity(null);
        setSelectedJanitor("");
        onRefresh();
      }
    }
  };

  // Helper to format text
  const formatText = (text: string) =>
    (text || "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Status badge
  const getStatusBadge = (status: string) => {
    const displayText = formatText(status);
    switch (status?.toLowerCase()) {
      case "done":
        return <Badge className="text-green-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      case "in_progress":
        return <Badge className="text-yellow-700 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      case "pending":
        return <Badge className="text-red-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      default:
        return <Badge className="text-gray-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
    }
  };

  // Priority badge
  const getPriorityBadge = (priority: string) => {
    const displayText = formatText(priority);
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Badge className="text-red-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      case "high":
        return <Badge className="text-red-500 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      case "medium":
        return <Badge className="text-yellow-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      case "low":
        return <Badge className="text-green-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
      default:
        return <Badge className="text-gray-600 font-semibold bg-transparent shadow-none px-0">{displayText}</Badge>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.bin_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.task_note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || log.activity_type === typeFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || log.priority === priorityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-transparent dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Error loading activities: {error}</p>
            <Button onClick={onRefresh} variant="ghost" className="hover:bg-gray-100 dark:hover:bg-gray-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      <Card className="bg-white dark:bg-gray-800 border-transparent dark:border-gray-700">
        <CardHeader className="pb-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Activity Logs</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredLogs.length} of {logs.length} Logs
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setClearAllModalOpen(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 py-1 h-auto"
                    >
                      Clear All
                    </Button>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Activity Filters Label and Clear All Button */}
          {userRole !== "admin" && (
            <div className="flex items-center justify-between">
              {/* <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Activity Filters</div> */}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 rounded-xl"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 border-gray-300 rounded-xl">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task_assignment">Task Assignment</SelectItem>
                <SelectItem value="bin_alert">Bin Alert</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="route_change">Route Change</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 border-gray-300 rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40 border-gray-300 rounded-xl">
                <SelectValue placeholder="All Priority" />
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

          {/* Table */}
          {loading ? (
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
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 5 }).map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No activities to display</p>
            </div>
          ) : (
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
                  {loading ? (
                    <ActivityLogsSkeleton />
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 py-6">
                        No activity logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={(e) => onCellClick?.(e, log)}
                      >
                        <TableCell
                          className="text-sm text-gray-900 dark:text-white w-32"
                          onClick={(e) => onCellClick?.(e, log)}
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium text-xs">
                                {new Date(
                                  log.timestamp || log.created_at || log.updated_at || Date.now()
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  log.timestamp || log.created_at || log.updated_at || Date.now()
                                ).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-900 dark:text-white w-64"
                          onClick={(e) => onCellClick?.(e, log)}
                        >
                          <div className="break-words whitespace-pre-wrap leading-relaxed text-xs">
                            {log.task_note || log.message || "No description"}
                          </div>
                        </TableCell>
                        <TableCell className="w-32" onClick={(e) => onCellClick?.(e, log)}>
                          {log.assigned_janitor_name && log.status !== "pending" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-900 dark:text-white">{log.assigned_janitor_name}</span>
                            </div>
                          ) : log.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignClick(log)}
                              className="text-xs border-gray-300 hover:bg-gray-50"
                            >
                              +Assign task
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Unassigned</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-900 dark:text-white w-24"
                          onClick={(e) => onCellClick?.(e, log)}
                        >
                          <div className="text-xs">{log.bin_location || log.location || "Unknown"}</div>
                        </TableCell>
                        <TableCell className="w-20 hover:bg-transparent" onClick={(e) => onCellClick?.(e, log)}>
                          {getStatusBadge(log.status || "")}
                        </TableCell>
                        <TableCell className="w-20 hover:bg-transparent" onClick={(e) => onCellClick?.(e, log)}>
                          {getPriorityBadge(log.priority || "")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      {/* {console.log("Rendering modal - assignModalOpen:", assignModalOpen, "selectedActivity:", selectedActivity)} */}
      <Dialog open={assignModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Details</Label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedActivity?.task_note || selectedActivity?.activity_type}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Location: {selectedActivity?.bin_location || "Unknown"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Janitor</Label>
              <Select value={selectedJanitor} onValueChange={setSelectedJanitor}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a janitor..." />
                </SelectTrigger>
                <SelectContent>
                  {janitorsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading janitors...
                    </SelectItem>
                  ) : janitors.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No janitors available
                    </SelectItem>
                  ) : (
                    janitors.map((janitor) => (
                      <SelectItem key={janitor.id} value={janitor.id}>
                        {janitor.fullName || janitor.name || janitor.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Notes (Optional)</Label>
              <textarea
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Add any additional notes for the janitor..."
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignSubmit}
              disabled={!selectedJanitor}
              className="bg-green-800 hover:bg-green-700"
            >
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirmation Modal */}
      <Dialog open={clearAllModalOpen} onOpenChange={setClearAllModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">Clear All Activity Logs</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to clear all activity logs? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setClearAllModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
