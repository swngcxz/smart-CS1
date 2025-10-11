import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StaffManagementModal } from "@/components/modal/staff/StaffManagementModal";
import { AddStaffModal } from "@/components/modal/staff/AddStaffModal";
import { StaffDetailsModal } from "@/components/modal/admin/StaffDetailsModal";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type StaffRecord = {
  id: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  role: string;
  location?: string;
  status?: string;
  lastActivity?: string;
  source?: string;
};

interface StaffTableProps {
  onStaffUpdate?: () => void;
}

export function StaffTable({ onStaffUpdate }: StaffTableProps) {
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/staff/all-with-counts");
      setStaffList(res.data.staff);
      console.log("Loaded admin staff data:", res.data);
      console.log(
        "Staff with contact numbers:",
        res.data.staff.map((s) => ({
          name: s.fullName,
          contactNumber: s.contactNumber,
          hasContactNumber: !!s.contactNumber,
        }))
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load staff");
      console.error("Error loading staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleRowClick = (staff: StaffRecord) => {
    // Map backend staff shape to modal's expected shape
    const modalStaff = {
      id: staff.id,
      name: staff.fullName,
      role: staff.role,
      zone: staff.location || "",
      status: staff.status || "active",
      lastActivity: staff.lastActivity || "",
      email: staff.email,
      contactNumber: staff.contactNumber,
    };
    setSelectedStaff(modalStaff);
    setIsDetailsModalOpen(true);
  };

  const handleAddStaff = async (payload: any) => {
    try {
      setLoading(true);
      await api.post("/api/staff", payload);
      toast({ title: "Staff added", description: `${payload.fullName} created.` });
      setAddModalOpen(false);
      await loadStaff();
      onStaffUpdate?.(); // Trigger parent refresh
    } catch (err: any) {
      toast({
        title: "Failed to add staff",
        description: err?.response?.data?.error || "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      setLoading(true);
      await api.delete(`/api/staff/${staffId}`);
      toast({ title: "Staff deleted", description: `Record removed.` });
      await loadStaff();
      onStaffUpdate?.(); // Trigger parent refresh
    } catch (err: any) {
      toast({
        title: "Failed to delete staff",
        description: err?.response?.data?.error || "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    // Apply all filters
    const filtered = staffList.filter((s) => {
      // Filter by role
      const matchesRole = selectedRole === "all" || s.role === selectedRole;
      // Filter by route
      const matchesRoute = selectedRoute === "all" || (s.location || "") === selectedRoute;
      // Filter by search term (name, email, contact number)
      const matchesSearch =
        searchTerm === "" ||
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contactNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      // Filter by status
      const matchesStatus = statusFilter === "all" || (s.status || "active") === statusFilter;

      return matchesRole && matchesRoute && matchesSearch && matchesStatus;
    });

    return filtered;
  }, [selectedRole, selectedRoute, searchTerm, statusFilter, staffList]);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-7 w-72 text-xs"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Role:</p>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-7 w-32 text-xs border-gray-300 dark:border-gray-700 rounded-md px-2">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="janitor">Janitor</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Route:</p>
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger className="h-7 w-36 text-xs border-gray-300 dark:border-gray-700 rounded-md px-2">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Route A">Route A</SelectItem>
                <SelectItem value="Route B">Route B</SelectItem>
                <SelectItem value="Route C">Route C</SelectItem>
                <SelectItem value="Route D">Route D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Status:</p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 w-32 text-xs border-gray-300 dark:border-gray-700 rounded-md px-2">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="break">Break</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              )}
              {error && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                filteredStaff.map((staff) => (
                  <TableRow
                    key={staff.id}
                    onClick={() => handleRowClick(staff)}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <TableCell className="font-medium">{staff.fullName}</TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{staff.contactNumber || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          staff.role === "staff"
                            ? "bg-blue-100 text-blue-800"
                            : staff.role === "janitor"
                            ? "bg-green-100 text-green-800"
                            : staff.role === "driver"
                            ? "bg-purple-100 text-purple-800"
                            : staff.role === "maintenance"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{staff.location || ""}</TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className={
                          "bg-transparent " +
                          ((staff.status || "active") === "active"
                            ? "text-green-800"
                            : (staff.status || "") === "break"
                            ? "text-yellow-800"
                            : (staff.status || "active") === "offline"
                            ? "text-red-600"
                            : "text-gray-700")
                        }
                      >
                        {(staff.status || "active").charAt(0).toUpperCase() + (staff.status || "active").slice(1)}
                      </Badge>
                    </TableCell>

                    {/* <TableCell>
                    <Badge 
                      variant="outline" 
                      className={staff.source === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                    >
                      {staff.source || 'Unknown'}
                    </Badge>
                  </TableCell> */}
                    {/* <TableCell>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteStaff(staff.id); }}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </TableCell> */}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StaffDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        staff={
          selectedStaff
            ? {
                id: selectedStaff.id,
                fullName: selectedStaff.name,
                email: selectedStaff.email,
                contactNumber: selectedStaff.contactNumber,
                role: selectedStaff.role,
                location: selectedStaff.zone,
                status: selectedStaff.status,
                lastActivity: selectedStaff.lastActivity,
                joinedDate: selectedStaff.joinedDate || "",
                bio: selectedStaff.bio || "",
              }
            : null
        }
      />
      {/* <StaffManagementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        staff={selectedStaff} 
        onStaffUpdate={loadStaff}
      />
      <AddStaffModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddStaff} /> */}
    </>
  );
}
