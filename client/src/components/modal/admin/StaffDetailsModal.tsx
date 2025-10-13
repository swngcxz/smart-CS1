import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, Phone, MapPin, Clock, Shield, FileText } from "lucide-react";

interface StaffDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    id: string;
    fullName: string;
    email: string;
    contactNumber?: string;
    role: string;
    location?: string;
    status?: string;
    lastActivity?: string;
    joinedDate?: string;
    bio?: string;
  } | null;
}

export function StaffDetailsModal({ isOpen, onClose, staff }: StaffDetailsModalProps) {
  if (!staff) return null;

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
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "maintenance":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatJoinedDate = (joinedDate: string) => {
    if (!joinedDate) return "May 12, 2023";
    const date = new Date(joinedDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Staff Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {staff.fullName
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                  (staff.status || "active") === "active"
                    ? "bg-green-500"
                    : (staff.status || "") === "break"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{staff.fullName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{staff.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ID: {staff.id}</p>
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
                staff.status || "active"
              )} px-3 py-1 text-xs font-medium hover:bg-transparent hover:text-current`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {(staff.status || "active").charAt(0).toUpperCase() + (staff.status || "active").slice(1)}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Route/Zone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {staff.location || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Joined On</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatJoinedDate(staff.joinedDate || "")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
