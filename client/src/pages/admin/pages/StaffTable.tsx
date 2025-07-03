import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffManagementModal } from "@/components/modal/staff/StaffManagementModal";
import { AddStaffModal } from "@/components/modal/staff/AddStaffModal";
export const staffData = [
  {
    id: 1,
    name: "John Smith",
    role: "Collection Driver",
    zone: "Route A",
    status: "active",
    lastActivity: "2 hours ago",
  },
  { id: 2, name: "Maria Garcia", role: "Supervisor", zone: "Route B", status: "active", lastActivity: "30 min ago" },
  {
    id: 3,
    name: "David Johnson",
    role: "Collection Driver",
    zone: "Route C",
    status: "offline",
    lastActivity: "1 day ago",
  },
  {
    id: 4,
    name: "Sarah Wilson",
    role: "Maintenance",
    zone: "Route D",
    status: "active",
    lastActivity: "1 hour ago",
  },
  {
    id: 5,
    name: "Michael Brown",
    role: "Collection Driver",
    zone: "Route A",
    status: "break",
    lastActivity: "15 min ago",
  },
];

export function StaffTable() {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState(staffData);

  const handleRowClick = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };
  const handleAddStaff = (newStaff) => {
    setStaffList((prev) => [...prev, { ...newStaff, id: prev.length + 1 }]);
    setAddModalOpen(false);
  };
  const filteredStaff = selectedRoute === "all" ? staffData : staffData.filter((staff) => staff.zone === selectedRoute);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="max-w-xs">
          <p className="text-gray-600 dark:text-gray-400">Filter Routes</p>
          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Route" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              <SelectItem value="Route A">Route A</SelectItem>
              <SelectItem value="Route B">Route B</SelectItem>
              <SelectItem value="Route C">Route C</SelectItem>
              <SelectItem value="Route D">Route D</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
        >
          + Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Staff Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => (
                <TableRow
                  key={staff.id}
                  onClick={() => handleRowClick(staff)}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>{staff.zone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        staff.status === "active" ? "default" : staff.status === "offline" ? "destructive" : "secondary"
                      }
                      className={
                        staff.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : staff.status === "break"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : ""
                      }
                    >
                      {staff.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">{staff.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StaffManagementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} staff={selectedStaff} />
      <AddStaffModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddStaff} />
    </>
  );
}
