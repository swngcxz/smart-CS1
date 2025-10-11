import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Shield, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Staff {
  id: number;
  name: string;
  role: string;
  zone: string;
  status: string;
  lastActivity: string;
  email?: string;
  contactNumber?: string;
  phone?: string;
}

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  onStaffUpdate?: () => void;
}

export function StaffManagementModal({ isOpen, onClose, staff, onStaffUpdate }: StaffManagementModalProps) {
  const [selectedZone, setSelectedZone] = useState(staff?.zone || "");
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when staff prop changes
  useEffect(() => {
    if (staff) {
      setSelectedZone(staff.zone || "");
    }
  }, [staff]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "break":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "offline":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "staff":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "janitor":
        return "text-green-600 bg-green-50 border-green-200";
      case "driver":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "maintenance":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleSaveRoute = async () => {
    if (!staff || selectedZone === staff.zone) return;

    setIsSaving(true);
    try {
      const updateData = {
        location: selectedZone,
      };

      await api.put(`/api/staff/${staff.id}`, updateData);
      toast({
        title: "Route assigned",
        description: `${staff.name} has been assigned to ${selectedZone}.`,
      });

      onStaffUpdate?.(); // Trigger parent refresh
    } catch (error: any) {
      toast({
        title: "Failed to assign route",
        description: error?.response?.data?.error || "An error occurred while assigning route.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Staff Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {staff.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                  staff.status === "active" ? "bg-green-500" : staff.status === "break" ? "bg-yellow-500" : "bg-red-500"
                }`}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{staff.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{staff.email}</p>
            </div>
          </div>

          {/* Status and Role Badges */}
          <div className="flex justify-center gap-3">
            <Badge
              className={`${getRoleColor(
                staff.role
              )} px-3 py-1 text-xs font-medium hover:bg-transparent hover:text-current`}
            >
              <Shield className="w-3 h-3 mr-1" />
              {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
            </Badge>
            <Badge
              className={`${getStatusColor(
                staff.status
              )} px-3 py-1 text-xs font-medium hover:bg-transparent hover:text-current`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
            </Badge>
          </div>

          {/* Staff Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{staff.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {staff.contactNumber || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current Route/Zone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{staff.zone || "Not assigned"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Assignment - Only for Janitors */}
          {staff.role.toLowerCase() === "janitor" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Route</h4>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1 h-7"
                  onClick={handleSaveRoute}
                  disabled={selectedZone === staff.zone || isSaving}
                >
                  {isSaving ? "..." : "Save"}
                </Button>
              </div>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="h-9 text-sm border-gray-300 rounded-lg">
                  <SelectValue placeholder="Choose route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Route A">Route A</SelectItem>
                  <SelectItem value="Route B">Route B</SelectItem>
                  <SelectItem value="Route C">Route C</SelectItem>
                  <SelectItem value="Route D">Route D</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
