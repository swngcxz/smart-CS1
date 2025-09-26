import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, UserPlus, Calendar, MapPin, User, Clock, AlertCircle } from "lucide-react";
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

  // Fetch janitors when modal opens
  const fetchJanitors = async () => {
    setJanitorsLoading(true);
    try {
      console.log("Fetching janitors from API...");
      const response = await api.get("/api/staff/janitors");
      console.log("Janitors API Response:", response.data);
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
      await api.put(`/api/activitylogs/${selectedActivity.id}`, {
        assigned_janitor_id: selectedJanitor,
        status: "in_progress"
      });
      
      setAssignModalOpen(false);
      setSelectedActivity(null);
      setSelectedJanitor("");
      onRefresh(); // Refresh the data
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "done":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">done</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">in_progress</Badge>;
      case "pending":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">urgent</Badge>;
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">high</Badge>;
      case "medium":
        return <Badge variant="outline">medium</Badge>;
      case "low":
        return <Badge variant="outline">low</Badge>;
      default:
        return <Badge variant="outline">{priority || "medium"}</Badge>;
    }
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case "task_assignment":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">task_assignment</Badge>;
      case "bin_alert":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">bin_alert</Badge>;
      case "collection":
        return <Badge variant="outline">collection</Badge>;
      case "maintenance":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">maintenance</Badge>;
      case "route_change":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">route_change</Badge>;
      case "cleaning":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">cleaning</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
      {/* Combined Activity Logs Container */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Activity Logs
            </CardTitle>
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Activity Filters
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500"
                />
              </div>
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
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Activity Type</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Description</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Assigned To</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Location</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Status</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Priority</TableHead>
                    <TableHead className="text-gray-900 dark:text-white font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActivityTypeBadge(log.activity_type)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white max-w-xs">
                        <div className="truncate">
                          {log.task_note || log.message || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.assigned_janitor_name ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {log.assigned_janitor_name}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignClick(log)}
                            className="text-xs border-gray-300 hover:bg-gray-50"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign Task
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {log.bin_location || log.location || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(log.priority)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          Level: {log.bin_level || 0}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Assign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="janitor" className="text-gray-700 dark:text-gray-300">Select Janitor</Label>
              <Select value={selectedJanitor} onValueChange={setSelectedJanitor} disabled={janitorsLoading}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder={janitorsLoading ? "Loading janitors..." : "Choose a janitor"} />
                </SelectTrigger>
                <SelectContent>
                  {janitorsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading janitors...
                    </SelectItem>
                  ) : janitors.length > 0 ? (
                    janitors.map((janitor) => (
                      <SelectItem key={janitor.id} value={janitor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{janitor.fullName}</span>
                          <span className="text-xs text-gray-500">
                            {janitor.location || 'General'} • {janitor.contactNumber || 'No contact'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-janitors" disabled>
                      No janitors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)} className="border-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAssignSubmit} 
              disabled={!selectedJanitor || selectedJanitor === "loading" || selectedJanitor === "no-janitors"} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}