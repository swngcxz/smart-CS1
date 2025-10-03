import React, { useState } from 'react';
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

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ActivityLogsTable({ logs, loading, error, onRefresh }: ActivityLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [selectedJanitor, setSelectedJanitor] = useState("");
  const [janitors, setJanitors] = useState<any[]>([]);
  const [janitorsLoading, setJanitorsLoading] = useState(false);

  const fetchJanitors = async () => {
    setJanitorsLoading(true);
    try {
      const response = await api.get("/api/staff/janitors");
      setJanitors(response.data || []);
    } catch (err) {
      console.error("Error fetching janitors:", err);
      setJanitors([]);
    } finally {
      setJanitorsLoading(false);
    }
  };

  const handleAssignClick = (activity: ActivityLog) => {
    setSelectedActivity(activity);
    setAssignModalOpen(true);
    fetchJanitors();
  };

  const handleAssignSubmit = async () => {
    if (!selectedActivity || !selectedJanitor || selectedJanitor === "loading" || selectedJanitor === "no-janitors") return;

    try {
      const selectedJanitorData = janitors.find(j => j.id === selectedJanitor);
      const janitorName = selectedJanitorData ? `${selectedJanitorData.fullName}` : "Unknown Janitor";

      await api.put(`/api/activitylogs/${selectedActivity.id}`, {
        assigned_janitor_id: selectedJanitor,
        assigned_janitor_name: janitorName,
        status: "in_progress"
      });

      setAssignModalOpen(false);
      setSelectedActivity(null);
      setSelectedJanitor("");
      onRefresh();
    } catch (err: any) {
      console.error("Error assigning task:", err);

      if (err.response?.status === 409 && err.response?.data?.error === 'Task assignment conflict') {
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
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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


  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.bin_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.task_note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.activity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || log.activity_type === typeFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || log.priority === priorityFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading activities...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredLogs.length} of {logs.length} Logs
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onRefresh} 
                      variant="ghost" 
                      size="sm" 
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh activity overview and logs</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 border-gray-300">
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
              <SelectTrigger className="w-full sm:w-40 border-gray-300">
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
              <SelectTrigger className="w-full sm:w-40 border-gray-300">
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
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No activities to display</p>
              <p className="text-sm text-gray-400">Check if data exists in database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Date & Time</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Description</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Assigned To</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Location</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Status</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {new Date(log.timestamp || log.created_at || log.updated_at || Date.now()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.timestamp || log.created_at || log.updated_at || Date.now()).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white max-w-xs">
                        <div className="truncate">{log.task_note || log.message || "No description"}</div>
                      </TableCell>
                      <TableCell>
                        {log.assigned_janitor_name && log.status !== 'pending' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 dark:text-white">{log.assigned_janitor_name}</span>
                          </div>
                        ) : log.status === 'pending' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignClick(log)}
                            className="text-xs border-gray-300 hover:bg-gray-50"
                          >
                            Assign Task
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        {log.bin_location || log.location || "Unknown"}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status || "")}</TableCell>
                      <TableCell>{getPriorityBadge(log.priority || "")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
