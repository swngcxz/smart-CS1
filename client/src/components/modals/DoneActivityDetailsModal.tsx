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

  // Debug logging for image data
  console.log("DoneActivityDetailsModal - Activity data:", {
    id: activity.id,
    photos: activity.photos,
    proof_image: activity.proof_image,
    hasPhotos: activity.photos && activity.photos.length > 0,
    firstPhoto: activity.photos?.[0],
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">
            Completed Activity Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Proof Picture Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Proof of Completion</h3>
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
              {(activity.photos && activity.photos.length > 0) || activity.proof_image ? (
                <div className="space-y-6">
                  {/* Main Image and Additional Photos Layout */}
                  {activity.photos && activity.photos.length > 1 ? (
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Main Image - Left Side */}
                      <div className="lg:w-2/3">
                        <div className="relative">
                          <img
                            src={activity.photos?.[0] || activity.proof_image}
                            alt="Proof of completion"
                            className="w-full h-auto max-h-80 mx-auto rounded-xl shadow-lg object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const nextElement = target.nextElementSibling as HTMLElement;
                              if (nextElement) nextElement.style.display = "block";
                            }}
                          />
                          <div style={{ display: "none" }} className="text-center py-12">
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 text-lg">Image failed to load</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Photos - Right Side */}
                      <div className="lg:w-1/3">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Additional Photos ({activity.photos.length - 1} more)
                        </h4>
                        <div className="space-y-3">
                          {activity.photos.slice(1).map((photo: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo}
                                alt={`Additional proof ${index + 2}`}
                                className="w-full h-24 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                  Photo {index + 2}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Single Image - Full Width */
                    <div className="relative">
                      <img
                        src={activity.photos?.[0] || activity.proof_image}
                        alt="Proof of completion"
                        className="w-full h-auto max-h-80 mx-auto rounded-xl shadow-lg object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = "none";
                          const nextElement = target.nextElementSibling as HTMLElement;
                          if (nextElement) nextElement.style.display = "block";
                        }}
                      />
                      <div style={{ display: "none" }} className="text-center py-12">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 text-lg">Image failed to load</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 text-lg">No proof image available</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Information Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Information</h3>
              <div className="text-sm font-regular text-gray-900 dark:text-white mb-1">
                {activity.formatted_date || formatDisplayDate(activity.timestamp)}
              </div>
              <div className="text-sm font-regular text-gray-900 dark:text-white mb-1">
                {activity.formatted_time || formatDisplayTime(activity.timestamp)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Completion Details Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Completion Details</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Bin ID:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{activity.bin_id || "N/A"}</span>
                    </div>
                    <div className="py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium block mb-2">Location:</span>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-sm">
                        {activity.bin_location || "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Completed By:</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-right">
                        {activity.assigned_janitor_name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Priority:</span>
                      <Badge className={`${getPriorityColor(activity.priority)} text-sm px-3 py-1`}>
                        {activity.display_priority || activity.priority || "Low"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Bin Status Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Bin Status</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="py-2">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Fill Level:</span>
                        <span className="font-bold text-lg text-gray-900 dark:text-white">
                          {activity.bin_level?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            activity.bin_level >= 85
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : activity.bin_level >= 70
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              : "bg-gradient-to-r from-green-500 to-green-600"
                          }`}
                          style={{ width: `${Math.min(activity.bin_level || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium block mb-2">Task Notes:</span>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                          {activity.task_note || "No additional notes provided"}
                        </p>
                      </div>
                    </div>
                    {activity.status_notes && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium block mb-2">Status Notes:</span>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                            {activity.status_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
