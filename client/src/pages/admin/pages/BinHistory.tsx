import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, MapPin, Trash2, AlertTriangle, CheckCircle, XCircle, Filter, Download, ChevronDown } from "lucide-react";
import api from "@/lib/api";

interface BinHistoryRecord {
  id: string;
  binId: string;
  timestamp: string;
  weight: number;
  distance: number;
  location: string;
  binLevel: number;
  gps: {
    lat: number;
    lng: number;
  };
  gpsValid: boolean;
  satellites: number;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

interface BinHistoryStats {
  totalRecords: number;
  criticalCount: number;
  warningCount: number;
  normalCount: number;
  errorCount: number;
  malfunctionCount: number;
}

export function BinHistory() {
  const [binHistory, setBinHistory] = useState<BinHistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<BinHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BinHistoryStats>({
    totalRecords: 0,
    criticalCount: 0,
    warningCount: 0,
    normalCount: 0,
    errorCount: 0,
    malfunctionCount: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [binIdFilter, setBinIdFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Fetch bin history data
  useEffect(() => {
    fetchBinHistory();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = binHistory;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.binId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Bin ID filter
    if (binIdFilter !== "all") {
      filtered = filtered.filter((record) => record.binId === binIdFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
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

      filtered = filtered.filter((record) => new Date(record.timestamp) >= filterDate);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [binHistory, searchTerm, statusFilter, binIdFilter, dateFilter]);

  const fetchBinHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/bin-history");

      if (response.data && response.data.success && response.data.records) {
        setBinHistory(response.data.records);
        setStats(
          response.data.stats || {
            totalRecords: response.data.records.length,
            criticalCount: response.data.records.filter((r: BinHistoryRecord) => r.status === "CRITICAL").length,
            warningCount: response.data.records.filter((r: BinHistoryRecord) => r.status === "WARNING").length,
            normalCount: response.data.records.filter((r: BinHistoryRecord) => r.status === "OK").length,
            errorCount: response.data.records.filter((r: BinHistoryRecord) => r.status === "ERROR").length,
            malfunctionCount: response.data.records.filter((r: BinHistoryRecord) => r.status === "MALFUNCTION").length,
          }
        );
      } else {
        setBinHistory([]);
        setError(response.data?.message || "No data received");
      }
      setError(null);
    } catch (err: any) {
      console.error("Error fetching bin history:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch bin history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "CRITICAL":
        return (
          <div className="flex items-center gap-1 text-red-600">
            Critical
          </div>
        );
      case "WARNING":
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            Warning
          </div>
        );
      case "OK":
        return (
          <div className="flex items-center gap-1 text-green-600">
            Normal
          </div>
        );
      case "ERROR":
        return (
          <div className="flex items-center gap-1 text-red-600">
            Error
          </div>
        );
      case "MALFUNCTION":
        return (
          <div className="flex items-center gap-1 text-orange-600">
            Malfunction
          </div>
        );
      default:
        return <div className="flex items-center gap-1 text-gray-600">{status}</div>;
    }
  };

  // Utility function to parse various timestamp formats
  const parseTimestamp = (timestamp: string): Date | null => {
    if (!timestamp || timestamp === 'Invalid Date' || timestamp === 'null' || timestamp === 'undefined') {
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
        date = new Date(timestamp.replace(' ', 'T')); // Handle space instead of T
      }
    }

    return isNaN(date.getTime()) ? null : date;
  };

  // Enhanced timestamp formatting for admin view
  const formatTimestamp = (timestamp: string) => {
    const date = parseTimestamp(timestamp);
    
    if (!date) {
      return {
        date: 'N/A',
        time: 'N/A',
        relative: 'Unknown'
      };
    }

    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
      }),
      time: date.toLocaleTimeString(),
      relative: diffInHours < 24 ? 
        (diffInHours < 1 ? `${Math.floor(diffInHours * 60)}m ago` : `${Math.floor(diffInHours)}h ago`) :
        date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
    };
  };

  const formatCoordinates = (gps: { lat: number; lng: number }) => {
    return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
  };

  const exportToCSV = () => {
    const headers = [
      "Bin ID",
      "Timestamp",
      "Bin Level (%)",
      "Location",
      "Status",
      "Error Message",
    ];
    const csvData = filteredHistory.map((record) => [
      record.binId,
      record.timestamp,
      record.binLevel,
      formatCoordinates(record.gps),
      record.status,
      record.errorMessage || "",
    ]);

    const csvContent = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bin-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredHistory.slice(startIndex, endIndex);

  // Get unique bin IDs for filter
  const uniqueBinIds = Array.from(new Set(binHistory.map((record) => record.binId)));

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bin History</h1>
          </div>
          <Button disabled className="flex items-center gap-2 bg-gray-100 text-gray-400 border border-gray-200 text-sm px-3 py-1.5 h-8">
            <Download className="w-3 h-3" />
            Export
          </Button>
        </div>

        {/* Status Summary */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300 font-medium">Total: 0</span>
          <span className="text-green-600 font-medium">Normal: 0</span>
          <span className="text-yellow-600 font-medium">Warning: 0</span>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-medium">Critical: 0</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bin history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bin History</h1>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 text-sm px-3 py-1.5 h-8">
          <Download className="w-3 h-3" />
          Export
        </Button>
      </div>

      {/* Status Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300 font-medium">Total: {stats.totalRecords}</span>
        <span className="text-green-600 font-medium">Normal: {stats.normalCount}</span>
        <span className="text-yellow-600 font-medium">Warning: {stats.warningCount}</span>
        <div className="flex items-center gap-1">
          <span className="text-red-600 font-medium">Critical: {stats.criticalCount}</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </div>
      </div>

      {/* Filter/Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="ok">Normal</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="malfunction">Malfunction</SelectItem>
          </SelectContent>
        </Select>

        <Select value={binIdFilter} onValueChange={setBinIdFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Bins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bins</SelectItem>
            {uniqueBinIds.map((binId) => (
              <SelectItem key={binId} value={binId}>
                {binId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      {error ? (
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-lg">{error}</p>
          <Button onClick={fetchBinHistory} className="bg-blue-600 hover:bg-blue-700 text-white">Retry</Button>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16">
          <Trash2 className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <p className="text-gray-500 text-lg">No bin history records found</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bin ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Bin Level (%)</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((record) => {
                      const { date, time, relative } = formatTimestamp(record.timestamp);
                      return (
                        <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.binId.charAt(0).toUpperCase() + record.binId.slice(1)}
                        </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium">{relative}</div>
                                {date !== 'N/A' && time !== 'N/A' ? (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    {date} {time}
                                  </div>
                                ) : (
                                  <div className="text-xs text-red-500 flex items-center gap-1">
                                    Invalid timestamp
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    record.binLevel >= 85
                                      ? "bg-red-500"
                                      : record.binLevel >= 70
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                  style={{ width: `${Math.min(record.binLevel, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{record.binLevel.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                         <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono">
                              {record.gpsValid ? record.location : "Invalid Location"}
                            </span>
                          </div>
                        </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length}{" "}
                  records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
