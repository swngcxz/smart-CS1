import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { History, Logs, Search, Filter, Calendar, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { HistoryLogsSkeleton } from "@/components/skeletons/HistoryLogsSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
interface LoginHistoryLog {
  id: string;
  userEmail: string;
  role: string;
  loginTime: string;
  logoutTime: string | null;
  sessionDuration: number | null; // in minutes
  status: "active" | "completed" | "offline";
  ipAddress: string;
  userAgent: string;
  location: string;
}

export const HistoryLogsTab = () => {
  const [logs, setLogs] = useState<LoginHistoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof LoginHistoryLog>("loginTime");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast } = useToast();

  const itemsPerPage = logs.length >= 1000 ? 5 : 10;
  // Fetch login history from API
  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching login history...");

      const response = await api.get(`/auth/login-history?t=${Date.now()}`);
      console.log("Login history response:", response.data);
      console.log("Response status:", response.status);

      const loginLogs = response.data.logs || response.data;
      console.log("Raw API response:", response.data);
      console.log("All login logs received:", loginLogs);
      console.log(
        "Admin logs in response:",
        loginLogs.filter(
          (log) =>
            log.role?.toLowerCase().trim() === "admin" ||
            log.role?.toLowerCase().trim() === "administrator" ||
            log.userEmail?.toLowerCase().includes("admin")
        )
      );
      setLogs(loginLogs);
      console.log(`Loaded ${loginLogs.length} login history records`);
      console.log("Sample record:", loginLogs[0]);
    } catch (err: any) {
      console.error("Error fetching login history:", err);
      console.error("Error response:", err.response);
      console.error("Error message:", err.message);
      setError(
        err?.response?.data?.error || err?.response?.data?.message || err?.message || "Failed to load login history"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const handleClearLogs = async () => {
    try {
      setLoading(true);
      await api.delete("/auth/clear-history"); // replace with your backend route
      toast({ title: "History Cleared", description: "All history logs have been deleted." });
      setLogs([]);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to clear logs. Try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Offline</Badge>;
      case "offline":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Offline</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Offline</Badge>;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Active";
    const date = new Date(dateString);

    const datePart = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });

    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return (
      <>
        <div>{datePart}</div>
        <div>{timePart}</div>
      </>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      staff: "bg-blue-100 text-blue-800",
      janitor: "bg-green-100 text-green-800",
      driver: "bg-purple-100 text-purple-800",
      maintenance: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge className={colors[role.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{role}</Badge>
    );
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "Active";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.length > 30) {
      return userAgent.substring(0, 30) + "...";
    }
    return userAgent;
  };

  // Sorting function
  const handleSort = (field: keyof LoginHistoryLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof LoginHistoryLog) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  // Filter and search logic
  const filteredLogs = logs.filter((log) => {
    // Exclude admin logs from display (comprehensive admin exclusion)
    const role = log.role?.toLowerCase().trim() || "";
    const userEmail = log.userEmail?.toLowerCase().trim() || "";

    if (role === "admin" || role === "administrator" || userEmail.includes("admin")) {
      console.log("Frontend filtering out admin log:", {
        userEmail: log.userEmail,
        role: log.role,
        trimmedRole: role,
        trimmedEmail: userEmail,
      });
      return false;
    }

    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress || "Unknown").toLowerCase().includes(searchTerm.toLowerCase());

    const logStatus = log.status || "offline";
    // Treat "completed" status as "offline" for display purposes
    const displayStatus = logStatus === "completed" ? "offline" : logStatus;
    const matchesStatus = statusFilter === "all" || displayStatus.toLowerCase() === statusFilter.toLowerCase();
    const matchesRole = roleFilter === "all" || log.role.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Sort the filtered logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle date sorting
    if (sortField === "loginTime" || sortField === "logoutTime") {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    // Handle null values for logoutTime
    if (sortField === "logoutTime") {
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === "asc" ? 1 : -1;
      if (bValue === null) return sortDirection === "asc" ? -1 : 1;
    }

    // Handle string sorting
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + itemsPerPage);

  // Calculate analytics from filtered data (excluding admin logs)
  const nonAdminLogs = logs.filter((log) => {
    const role = log.role?.toLowerCase() || "";
    return role !== "admin" && role !== "administrator" && !log.userEmail?.toLowerCase().includes("admin");
  });
  const activeSessions = nonAdminLogs.filter((log) => (log.status || "offline") === "active").length;
  const offlineSessions = nonAdminLogs.filter((log) => {
    const status = log.status || "offline";
    return status === "completed" || status === "offline";
  }).length;
  const averageSessionDuration =
    nonAdminLogs
      .filter((log) => log.sessionDuration !== null)
      .reduce((sum, log) => sum + (log.sessionDuration || 0), 0) /
    Math.max(nonAdminLogs.filter((log) => log.sessionDuration !== null).length, 1);

  // Show skeleton loading state for table only
  const showTableSkeleton = loading;

  return (
    <div className="space-y-6 p-4 sm:p-2">
      {/* Section Title with Inline Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">History Logs</h2>

        {/* Total History Logs */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs dark:text-gray-300">Total Logs:</span>
          <span className="font-regular text-xs text-gray-600 dark:text-gray-400">{nonAdminLogs.length}</span>
        </div>
      </div>

      {/* Filters and Search - Responsive Layout */}
      <div className="bg-transparent border-0 shadow-none p-0">
        <div className="space-y-4">
          {/* Error State */}

          {error && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <History className="h-12 w-12 mx-auto mb-2" />
                <p className="text-lg font-medium">Error loading login history</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={fetchLoginHistory} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {!error && (
            <>
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3  dark:bg-gray-900 dark:border-gray-700">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Search by Email, Role, or IP Address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 ">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-36 h-8 text-sm">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-36 h-8 text-sm">
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="janitor">Janitor</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-1 h-8 px-3 text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Mobile Card View for Small Screens */}
              <div className="block sm:hidden space-y-4  dark:bg-gray-900 dark:border-gray-700">
                {showTableSkeleton
                  ? // Mobile skeleton cards
                    Array.from({ length: 3 }).map((_, index) => (
                      <Card key={index} className="border-l-4 border-l-gray-300">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-6 w-16" />
                          </div>
                          <div className="space-y-2">
                            {Array.from({ length: 6 }).map((_, itemIndex) => (
                              <div key={itemIndex} className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : paginatedLogs.map((log) => (
                      <Card key={log.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg">{log.userEmail}</h3>
                            {getStatusBadge(log.status)}
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Role:</span>
                              {getRoleBadge(log.role)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Login Time:</span>
                              <span className="font-medium">{new Date(log.loginTime).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Logout Time:</span>
                              <span className="font-medium">
                                {log.logoutTime ? new Date(log.logoutTime).toLocaleString() : "Active"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{formatDuration(log.sessionDuration)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">IP Address:</span>
                              <span className="font-medium">{log.ipAddress || "Unknown"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Device:</span>
                              <span className="font-medium" title={log.userAgent || "Unknown"}>
                                {formatUserAgent(log.userAgent || "Unknown")}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto  dark:bg-gray-900 dark:border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="min-w-[200px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSort("userEmail")}
                      >
                        <div className="flex items-center gap-2">
                          User Email
                          {getSortIcon("userEmail")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSort("role")}
                      >
                        <div className="flex items-center gap-2">
                          Role
                          {getSortIcon("role")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="min-w-[150px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSort("loginTime")}
                      >
                        <div className="flex items-center gap-2">Login Time</div>
                      </TableHead>
                      <TableHead
                        className="min-w-[150px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSort("logoutTime")}
                      >
                        <div className="flex items-center gap-2">Logout Time</div>
                      </TableHead>
                      {/* <TableHead 
                    className="min-w-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("sessionDuration")}
                  >
                    <div className="flex items-center gap-2">
                      Duration
                    </div>
                  </TableHead> */}
                      <TableHead
                        className="min-w-[120px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSort("ipAddress")}
                      >
                        <div className="flex items-center gap-2">IP Address</div>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-2">Status</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showTableSkeleton
                      ? // Desktop skeleton rows
                        Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell>
                              <Skeleton className="h-4 w-32" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-4 w-20 font-mono text-xs" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                          </TableRow>
                        ))
                      : paginatedLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{log.userEmail}</TableCell>
                            <TableCell>
                              <Badge
                                className={getRoleBadge(log.role).props.className.replace(/bg-\S+/g, "bg-transparent")}
                              >
                                {getRoleBadge(log.role).props.children.charAt(0).toUpperCase() +
                                  getRoleBadge(log.role).props.children.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{formatDateTime(log.loginTime)}</TableCell>
                            <TableCell className="text-xs">{formatDateTime(log.logoutTime)}</TableCell>

                            {/* <TableCell className="font-medium">{formatDuration(log.sessionDuration)}</TableCell> */}
                            <TableCell className="font-mono text-xs">{log.ipAddress || "Unknown"}</TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusBadge(log.status).props.className.replace(
                                  /bg-\S+/g,
                                  "bg-transparent"
                                )}
                              >
                                {getStatusBadge(log.status).props.children.charAt(0).toUpperCase() +
                                  getStatusBadge(log.status).props.children.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                  <div className="text-xs text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedLogs.length)} of{" "}
                    {sortedLogs.length} results
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {sortedLogs.length === 0 && (
                <div className="text-center py-8">
                  <Logs className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </>
          )}

          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-md w-[90%] sm:w-[360px] text-center space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Clear all history logs?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This will permanently remove all login records.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
