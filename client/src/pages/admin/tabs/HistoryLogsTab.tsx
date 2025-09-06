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
import { History, Logs, Search, Filter, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import api from "@/lib/api";

interface LoginHistoryLog {
  id: string;
  userEmail: string;
  role: string;
  loginTime: string;
  logoutTime: string | null;
  sessionDuration: number | null; // in minutes
  status: "active" | "completed";
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
  const itemsPerPage = 5;

  // Fetch login history from API
  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching login history...");
      
      const response = await api.get("/api/login-history");
      console.log("📊 Login history response:", response.data);
      
      const loginLogs = response.data.logs || response.data;
      setLogs(loginLogs);
      console.log(`✅ Loaded ${loginLogs.length} login history records`);
    } catch (err: any) {
      console.error("❌ Error fetching login history:", err);
      setError(err?.response?.data?.error || err?.message || "Failed to load login history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-purple-100 text-purple-800",
      staff: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[role.toLowerCase() as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{role}</Badge>;
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
    const matchesSearch =
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
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

  // Calculate analytics from sorted data
  const activeSessions = sortedLogs.filter((log) => log.status === "active").length;
  const completedSessions = sortedLogs.filter((log) => log.status === "completed").length;
  const averageSessionDuration = sortedLogs
    .filter((log) => log.sessionDuration !== null)
    .reduce((sum, log) => sum + (log.sessionDuration || 0), 0) / 
    Math.max(sortedLogs.filter((log) => log.sessionDuration !== null).length, 1);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeSessions}</div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedSessions}</div>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md sm:col-span-2 lg:col-span-1 dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(Math.round(averageSessionDuration))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search - Responsive Layout */}
      <Card className=" dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Login History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4  dark:bg-gray-900 dark:border-gray-700">
          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading login history...</p>
            </div>
          )}

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

          {!loading && !error && (
            <>
              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4  dark:bg-gray-900 dark:border-gray-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Email, Role, or IP Address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 ">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Card View for Small Screens */}
          <div className="block sm:hidden space-y-4  dark:bg-gray-900 dark:border-gray-700">
            {paginatedLogs.map((log) => (
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
                      <span className="font-medium">{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : "Active"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{formatDuration(log.sessionDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IP Address:</span>
                      <span className="font-medium">{log.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device:</span>
                      <span className="font-medium" title={log.userAgent}>{formatUserAgent(log.userAgent)}</span>
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
                    <div className="flex items-center gap-2">
                      Login Time
                      {getSortIcon("loginTime")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="min-w-[150px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("logoutTime")}
                  >
                    <div className="flex items-center gap-2">
                      Logout Time
                      {getSortIcon("logoutTime")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="min-w-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("sessionDuration")}
                  >
                    <div className="flex items-center gap-2">
                      Duration
                      {getSortIcon("sessionDuration")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="min-w-[120px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("ipAddress")}
                  >
                    <div className="flex items-center gap-2">
                      IP Address
                      {getSortIcon("ipAddress")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="min-w-[100px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{log.userEmail}</TableCell>
                    <TableCell>{getRoleBadge(log.role)}</TableCell>
                    <TableCell className="text-sm">{new Date(log.loginTime).toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{log.logoutTime ? new Date(log.logoutTime).toLocaleString() : "Active"}</TableCell>
                    <TableCell className="font-medium">{formatDuration(log.sessionDuration)}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                  <div className="text-sm text-gray-600">
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
        </CardContent>
      </Card>
    </div>
  );
};
