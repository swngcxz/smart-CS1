import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffManagementModal } from "@/components/modal/staff/StaffManagementModal";
import { AddStaffModal } from "@/components/modal/staff/AddStaffModal";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/staff/all-with-counts");
      console.log("Current user:", user?.email);
      console.log("Loaded staff data:", res.data);
      setStaffList(res.data.staff);
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
    setIsModalOpen(true);
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
      toast({ title: "Failed to add staff", description: err?.response?.data?.error || "Error", variant: "destructive" });
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
      toast({ title: "Failed to delete staff", description: err?.response?.data?.error || "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    // Filter out the current logged-in user and apply route filter
    let filtered = staffList.filter((s) => {
      // Exclude current user
      const isNotCurrentUser = !user || s.email !== user.email;
      // Filter by route
      const matchesRoute = selectedRoute === "all" || (s.location || "") === selectedRoute;
      return isNotCurrentUser && matchesRoute;
    });
    
    return filtered;
  }, [selectedRoute, staffList, user]);

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

        <button onClick={() => setAddModalOpen(true)} className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">
          + Add Janitor
        </button>
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
          <TableHead>Last Activity</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-sm text-gray-500">Loading...</TableCell>
          </TableRow>
        )}
        {error && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-sm text-red-600">{error}</TableCell>
          </TableRow>
        )}
        {!loading && !error && filteredStaff.map((staff) => (
          <TableRow
            key={staff.id}
            onClick={() => handleRowClick(staff)}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <TableCell className="font-medium">{staff.fullName}</TableCell>
            <TableCell>{staff.email}</TableCell>
            <TableCell>{staff.contactNumber || "N/A"}</TableCell>
            <TableCell>{staff.role}</TableCell>
            <TableCell>{staff.location || ""}</TableCell>
            <TableCell>
              <Badge
                variant={
                  (staff.status || "active") === "active"
                    ? "default"
                    : (staff.status || "active") === "offline"
                    ? "destructive"
                    : "secondary"
                }
                className={
                  (staff.status || "active") === "active"
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : (staff.status || "") === "break"
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    : ""
                }
              >
                {staff.status || "active"}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-500">{staff.lastActivity || ""}</TableCell>
            {/* <TableCell>
              <Badge 
                variant="outline" 
                className={staff.source === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
              >
                {staff.source || 'Unknown'}
              </Badge>
            </TableCell> */}
            <TableCell>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteStaff(staff.id); }}
                className="text-red-600 hover:underline text-sm"
              >
                Delete
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>


      <StaffManagementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        staff={selectedStaff} 
        onStaffUpdate={loadStaff}
      />
      <AddStaffModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={handleAddStaff} />
    </>
  );
}
