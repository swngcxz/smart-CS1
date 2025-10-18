import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, Trash2, AlertTriangle } from "lucide-react";

interface DoneActivityDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: any;
  getActivityTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  formatDisplayDate: (timestamp: string) => string;
  formatDisplayTime: (timestamp: string) => string;
  formatActivityDescription: (activity: any) => string;
}

export function DoneActivityDetailsModal({
  open,
  onOpenChange,
  activity,
  getActivityTypeColor,
  getStatusColor,
  getPriorityColor,
  formatDisplayDate,
  formatDisplayTime,
  formatActivityDescription,
}: DoneActivityDetailsModalProps) {
  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Completed Activity Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Proof Picture Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proof of Completion</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              {activity.proof_image ? (
                <div className="space-y-4">
                  <img
                    src={activity.proof_image}
                    alt="Proof of completion"
                    className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling.style.display = "block";
                    }}
                  />
                  <div style={{ display: "none" }} className="text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Image failed to load</p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No proof image available</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Completion Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed At:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {activity.formatted_date || formatDisplayDate(activity.timestamp)} at{" "}
                      {activity.formatted_time || formatDisplayTime(activity.timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed By:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {activity.assigned_janitor_name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Activity Type:</span>
                    <Badge className={`${getActivityTypeColor(activity.activity_type || "Unknown")} text-xs`}>
                      {activity.activity_type || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bin ID:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{activity.bin_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location:</span>
                    <span
                      className="font-medium text-gray-900 dark:text-white text-right max-w-[200px] truncate"
                      title={activity.bin_location}
                    >
                      {activity.bin_location || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Bin Status
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Fill Level:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            activity.bin_level >= 85
                              ? "bg-red-500"
                              : activity.bin_level >= 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(activity.bin_level || 0, 100)}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.bin_level?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <Badge className={`${getStatusColor(activity.status)} text-xs`}>
                      {activity.display_status || activity.status || "Completed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Priority:</span>
                    <Badge className={`${getPriorityColor(activity.priority)} text-xs`}>
                      {activity.display_priority || activity.priority || "Low"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Additional Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 block mb-1">Task Notes:</span>
                    <p className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 p-2 rounded border text-xs">
                      {activity.task_note || "No additional notes provided"}
                    </p>
                  </div>
                  {activity.status_notes && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block mb-1">Status Notes:</span>
                      <p className="text-gray-900 dark:text-white bg-white dark:bg-gray-700 p-2 rounded border text-xs">
                        {activity.status_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Description */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Activity Description</h4>
            <p className="text-gray-700 dark:text-gray-300">{formatActivityDescription(activity)}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
