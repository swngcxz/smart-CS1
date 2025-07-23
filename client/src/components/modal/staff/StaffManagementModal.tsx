import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Clock, Route } from "lucide-react";

interface Staff {
  id: number;
  name: string;
  role: string;
  zone: string;
  status: string;
  lastActivity: string;
  email?: string;
  phone?: string;
}

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export function StaffManagementModal({ isOpen, onClose, staff }: StaffManagementModalProps) {
  const [selectedRole, setSelectedRole] = useState(staff?.role || "");
  const [selectedZone, setSelectedZone] = useState(staff?.zone || "");
  const [assignedTask, setAssignedTask] = useState("");

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="space-y-6">
          {/* Staff Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <p className="text-lg font-semibold">{staff.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <Badge
                    variant={
                      staff.status === "active" ? "default" : staff.status === "offline" ? "destructive" : "secondary"
                    }
                    className={
                      staff.status === "active"
                        ? "bg-green-100 text-green-800"
                        : staff.status === "break"
                        ? "bg-yellow-100 text-yellow-800"
                        : ""
                    }
                  >
                    {staff.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Activity</label>
                  <p className="text-sm text-gray-600">{staff.lastActivity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Zone</label>
                  <p className="text-sm">{staff.zone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Assign Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Assign Collection Zone
                </label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zone A">Zone A - Downtown</SelectItem>
                    <SelectItem value="Zone B">Zone B - Residential North</SelectItem>
                    <SelectItem value="Zone C">Zone C - Industrial</SelectItem>
                    <SelectItem value="Zone D">Zone D - Residential South</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Task Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Task Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Assign New Task
                </label>
                <Select value={assignedTask} onValueChange={setAssignedTask}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular-collection">Regular Collection Route</SelectItem>
                    <SelectItem value="emergency-pickup">Emergency Pickup</SelectItem>
                    <SelectItem value="bin-maintenance">Bin Maintenance</SelectItem>
                    <SelectItem value="route-inspection">Route Inspection</SelectItem>
                    <SelectItem value="training">Training Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {assignedTask && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Task Details:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {assignedTask === "regular-collection" && "Assign regular waste collection route"}
                    {assignedTask === "emergency-pickup" && "Immediate pickup required in assigned zone"}
                    {assignedTask === "bin-maintenance" && "Maintenance and repair of collection bins"}
                    {assignedTask === "route-inspection" && "Inspect and verify collection routes"}
                    {assignedTask === "training" && "Training session for new procedures"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-green-600 hover:bg-green-700">Save Changes</Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
