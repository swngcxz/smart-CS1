import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Logs } from "lucide-react";

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
];

export const HistoryLogsTab = () => {
  const [logs] = useState<WasteCollectionLog[]>(sampleData);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getWasteLevelColor = (level: number) => {
    if (level >= 90) return "text-red-600 font-semibold";
    if (level >= 70) return "text-yellow-600 font-semibold";
    return "text-green-600 font-semibold";
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collections Today</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">+20% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Waste Level</CardTitle>
            <Logs className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.6%</div>
            <p className="text-xs text-muted-foreground">Across all collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight Collected</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">136 kg</div>
            <p className="text-xs text-muted-foreground">Today's total</p>
          </CardContent>
        </Card>
      </div>

      {/* History Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collection History Logs</CardTitle>
          <CardDescription>Detailed logs of waste collection activities with timestamps and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bin ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Waste Level</TableHead>
                <TableHead>Collection Time</TableHead>
                <TableHead>Collector ID</TableHead>
                <TableHead>Waste Type</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.binId}</TableCell>
                  <TableCell>{log.location}</TableCell>
                  <TableCell className={getWasteLevelColor(log.wasteLevel)}>{log.wasteLevel}%</TableCell>
                  <TableCell>{new Date(log.collectionTime).toLocaleString()}</TableCell>
                  <TableCell>{log.collectorId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.wasteType}</Badge>
                  </TableCell>
                  <TableCell>{log.weight > 0 ? log.weight : "-"}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
