import React, { useState } from "react";
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
import { History, Logs, Search, Filter, Calendar } from "lucide-react";

interface WasteCollectionLog {
  id: string;
  binId: string;
  location: string;
  wasteLevel: number;
  collectionTime: string;
  collectorId: string;
  wasteType: string;
  status: "completed" | "pending" | "failed";
  weight: number;
}

const sampleData: WasteCollectionLog[] = [
  {
    id: "1",
    binId: "BIN-001",
    location: "Main Street Corner",
    wasteLevel: 85,
    collectionTime: "2024-06-18 08:30:00",
    collectorId: "COL-001",
    wasteType: "General",
    status: "completed",
    weight: 45.2,
  },
  {
    id: "2",
    binId: "BIN-002",
    location: "Park Avenue",
    wasteLevel: 92,
    collectionTime: "2024-06-18 09:15:00",
    collectorId: "COL-002",
    wasteType: "Recyclable",
    status: "completed",
    weight: 38.7,
  },
  {
    id: "3",
    binId: "BIN-003",
    location: "Shopping Center",
    wasteLevel: 78,
    collectionTime: "2024-06-18 10:45:00",
    collectorId: "COL-001",
    wasteType: "Organic",
    status: "completed",
    weight: 52.1,
  },
  {
    id: "4",
    binId: "BIN-004",
    location: "City Center",
    wasteLevel: 95,
    collectionTime: "2024-06-18 11:20:00",
    collectorId: "COL-003",
    wasteType: "General",
    status: "failed",
    weight: 0,
  },
  {
    id: "5",
    binId: "BIN-005",
    location: "Residential Area A",
    wasteLevel: 88,
    collectionTime: "2024-06-18 14:30:00",
    collectorId: "COL-002",
    wasteType: "Recyclable",
    status: "pending",
    weight: 0,
  },
  {
    id: "6",
    binId: "BIN-006",
    location: "Business District",
    wasteLevel: 76,
    collectionTime: "2024-06-17 16:45:00",
    collectorId: "COL-001",
    wasteType: "General",
    status: "completed",
    weight: 41.3,
  },
  {
    id: "7",
    binId: "BIN-007",
    location: "School Zone",
    wasteLevel: 82,
    collectionTime: "2024-06-17 13:20:00",
    collectorId: "COL-003",
    wasteType: "Organic",
    status: "completed",
    weight: 29.8,
  },
];

export const HistoryLogsTab = () => {
  const [logs] = useState<WasteCollectionLog[]>(sampleData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wasteTypeFilter, setWasteTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getWasteLevelColor = (level: number) => {
    if (level >= 90) return "text-red-600 font-semibold";
    if (level >= 70) return "text-yellow-600 font-semibold";
    return "text-green-600 font-semibold";
  };

  const getWasteTypeBadge = (type: string) => {
    const colors = {
      General: "bg-gray-100 text-gray-800",
      Recyclable: "bg-blue-100 text-blue-800",
      Organic: "bg-green-100 text-green-800",
    };
    return <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
  };

  // Filter and search logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.binId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.collectorId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesWasteType = wasteTypeFilter === "all" || log.wasteType === wasteTypeFilter;

    return matchesSearch && matchesStatus && matchesWasteType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  // Calculate analytics from filtered data
  const completedCollections = filteredLogs.filter((log) => log.status === "completed").length;
  const averageWasteLevel =
    filteredLogs.length > 0
      ? (filteredLogs.reduce((sum, log) => sum + log.wasteLevel, 0) / filteredLogs.length).toFixed(1)
      : "0";
  const totalWeight = filteredLogs
    .filter((log) => log.status === "completed")
    .reduce((sum, log) => sum + log.weight, 0)
    .toFixed(1);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Collections</CardTitle>
            <History className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedCollections}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">↗ +20% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Avg Waste Level</CardTitle>
            <Logs className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averageWasteLevel}%</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all collections</p>
          </CardContent>
        </Card>

        <Card className="transition-all hover:shadow-md sm:col-span-2 lg:col-span-1 dark:bg-gray-900 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Weight Collected</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalWeight} kg</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search - Responsive Layout */}
      <Card className=" dark:bg-gray-900 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Logs className="h-5 w-5 text-green-600" />
            Collection History Logs
          </CardTitle>
          <CardDescription>Detailed logs of waste collection activities with real-time filtering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4  dark:bg-gray-900 dark:border-gray-700">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4  dark:bg-gray-900 dark:border-gray-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by Bin ID, Location, or Collector..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Recyclable">Recyclable</SelectItem>
                  <SelectItem value="Organic">Organic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Card View for Small Screens */}
          <div className="block sm:hidden space-y-4  dark:bg-gray-900 dark:border-gray-700">
            {paginatedLogs.map((log) => (
              <Card key={log.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{log.binId}</h3>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{log.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waste Level:</span>
                      <span className={getWasteLevelColor(log.wasteLevel)}>{log.wasteLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{new Date(log.collectionTime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Collector:</span>
                      <span>{log.collectorId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Type:</span>
                      {getWasteTypeBadge(log.wasteType)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{log.weight > 0 ? `${log.weight} kg` : "-"}</span>
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
                  <TableHead className="min-w-[100px]">Bin ID</TableHead>
                  <TableHead className="min-w-[150px]">Location</TableHead>
                  <TableHead className="min-w-[100px]">Waste Level</TableHead>
                  <TableHead className="min-w-[150px]">Collection Time</TableHead>
                  <TableHead className="min-w-[100px]">Collector</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[80px]">Weight</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{log.binId}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.location}>
                      {log.location}
                    </TableCell>
                    <TableCell className={getWasteLevelColor(log.wasteLevel)}>{log.wasteLevel}%</TableCell>
                    <TableCell className="text-sm">{new Date(log.collectionTime).toLocaleString()}</TableCell>
                    <TableCell>{log.collectorId}</TableCell>
                    <TableCell>{getWasteTypeBadge(log.wasteType)}</TableCell>
                    <TableCell className="font-medium">{log.weight > 0 ? `${log.weight} kg` : "-"}</TableCell>
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
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of{" "}
                {filteredLogs.length} results
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

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Logs className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
