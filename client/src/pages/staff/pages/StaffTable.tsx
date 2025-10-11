import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffManagementModal } from "@/components/modal/staff/StaffManagementModal";
import { AddStaffModal } from "@/components/modal/staff/AddStaffModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import StaffTableSkeleton from "@/components/skeletons/StaffTableSkeleton";
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
  totalStaff?: number;
}

export function StaffTable({ onStaffUpdate, totalStaff }: StaffTableProps) {
  const { user } = useAuth();
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffRecord | null>(null);

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
      toast({
        title: "Failed to add staff",
        description: err?.response?.data?.error || "Error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (staff: StaffRecord) => {
    setStaffToDelete(staff);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/api/staff/${staffToDelete.id}`);
      toast({ title: "Staff deleted", description: `Record removed.` });
      await loadStaff();
      onStaffUpdate?.(); // Trigger parent refresh
      setDeleteConfirmOpen(false);
      setStaffToDelete(null);
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
    // Filter out the current logged-in user and apply route filter
    const filtered = staffList.filter((s) => {
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
        <div className="flex items-center gap-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Route:</p>
          <Select value={selectedRoute} onValueChange={setSelectedRoute}>
            <SelectTrigger className="h-7 w-28 text-xs border-gray-300 dark:border-gray-700 rounded-md px-2">
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-600">Total Staff:</span>
            <span className="text-xs text-gray-600">{totalStaff || 0}</span>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-green-700 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Janitor
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="pt-2">
          <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Name</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Contact Number</TableHead>
                 <TableHead className="text-center">Role</TableHead>
                 <TableHead>Route</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead className="text-center">Action</TableHead>
               </TableRow>
             </TableHeader>
            <TableBody>
              {loading && <StaffTableSkeleton />}
              {error && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-red-600">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                !error &&
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id} onClick={() => handleRowClick(staff)} className="cursor-pointer">
                    <TableCell className="font-medium text-sm">{staff.fullName}</TableCell>
                    <TableCell className="text-sm">{staff.email}</TableCell>
                    <TableCell className="text-sm">{staff.contactNumber || "N/A"}</TableCell>
                     <TableCell>
                       <div className="flex justify-center">
                         <Badge
                           variant="outline"
                           className={
                             staff.role === "staff"
                               ? "bg-blue-100 text-blue-800 text-xs font-regular"
                               : staff.role === "janitor"
                               ? "bg-green-100 text-green-800 text-xs font-regular"
                               : staff.role === "driver"
                               ? "bg-blue-100 text-blue-800 text-xs font-regular"
                               : staff.role === "maintenance"
                               ? "bg-orange-100 text-orange-800 text-xs font-regular"
                               : "bg-gray-100 text-gray-800 text-xs font-regular"
                           }
                         >
                           {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                         </Badge>
                       </div>
                     </TableCell>

                    <TableCell className="text-sm">{staff.location || ""}</TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${
                          (staff.status || "active") === "active"
                            ? "text-green-600 font-semibold"
                            : (staff.status || "") === "offline"
                            ? "text-red-600 font-semibold"
                            : (staff.status || "") === "break"
                            ? "text-yellow-600 font-semibold"
                            : "text-gray-600 font-semibold"
                        } bg-transparent hover:bg-transparent shadow-none px-0`}
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
                    <TableCell>
                      <div className="flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(staff);
                          }}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Remove User?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove <span className="font-medium">{staffToDelete?.fullName}</span>?
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(false)} className="px-4">
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteStaff} disabled={loading} className="px-4">
                {loading ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
