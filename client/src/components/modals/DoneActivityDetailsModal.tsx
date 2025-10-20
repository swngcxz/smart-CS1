import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, Trash2, AlertTriangle, Expand, X } from "lucide-react";

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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");

  if (!activity) return null;

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
    onOpenChange(false); // Close the main modal when opening full-size image
  };

  // Debug logging for image data
  console.log("DoneActivityDetailsModal - Activity data:", {
    id: activity.id,
    photos: activity.photos,
    proof_image: activity.proof_image,
    hasPhotos: activity.photos && activity.photos.length > 0,
    firstPhoto: activity.photos?.[0],
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-gray-900 dark:text-white">
              Completed Activity Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Combined Picture and Details Layout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Details</h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-regular text-gray-900 dark:text-white">
                    {(() => {
                      const date = new Date(activity.timestamp);
                      if (isNaN(date.getTime())) return "N/A";
                      const dateStr = date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      const timeStr = date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      });
                      return `${dateStr} ${timeStr}`;
                    })()}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <div className="flex gap-4">
                  {/* Picture Section - Left Side */}
                  <div className="flex-shrink-0">
                    {(activity.photos && activity.photos.length > 0) || activity.proof_image ? (
                      <div className="space-y-3">
                        {/* Main Image - Compact with Zoom Button */}
                        <div className="relative group">
                          <img
                            src={activity.photos?.[0] || activity.proof_image}
                            alt="Proof of completion"
                            className="w-60 h-60 object-cover rounded-lg shadow-sm"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = "none";
                              const nextElement = target.nextElementSibling as HTMLElement;
                              if (nextElement) nextElement.style.display = "block";
                            }}
                          />
                          <div style={{ display: "none" }} className="text-center py-8">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500 text-sm">Image failed to load</p>
                          </div>
                          <button
                            className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                            onClick={() => handleImageClick(activity.photos?.[0] || activity.proof_image)}
                          >
                            <Expand className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Additional Photos - Vertical Stack */}
                        {activity.photos && activity.photos.length > 1 && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              +{activity.photos.length - 1} more
                            </p>
                            <div className="space-y-1">
                              {activity.photos.slice(1, 3).map((photo: string, index: number) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={photo}
                                    alt={`Additional proof ${index + 2}`}
                                    className="w-16 h-16 object-cover rounded"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                  <button
                                    className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                                    onClick={() => handleImageClick(photo)}
                                  >
                                    <Expand className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-60 h-60 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="text-center">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-500 text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details Section - Right Side */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Bin ID:</span>
                        <span className="font-regular text-gray-900 dark:text-white">{activity.bin_id || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Completed By:</span>
                        <span className="font-regular text-gray-900 dark:text-white text-right">
                          {activity.assigned_janitor_name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Fill Level:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {activity.bin_level?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
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

                    {/* Location - Full Width */}
                    <div className="mt-3 pt-3  border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium text-xs block mb-1">Location:</span>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                        {activity.bin_location || "N/A"}
                      </p>
                    </div>

                    {/* Task Notes - Full Width */}
                    <div className="mt-3 pt-3 border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 font-medium text-xs block mb-1">
                        Task Notes:
                      </span>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                        {activity.task_note || "No additional notes provided"}
                      </p>
                    </div>

                    {/* Status Notes - Full Width */}
                    {activity.status_notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-xs block mb-1">
                          Status Notes:
                        </span>
                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-900 dark:text-white text-xs leading-relaxed">
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
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Modal */}
      <Dialog
        open={imageModalOpen}
        onOpenChange={(open) => {
          setImageModalOpen(open);
          if (!open) {
            // Reopen the main modal when full-size image closes
            onOpenChange(true);
          }
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
              onClick={() => {
                setImageModalOpen(false);
                onOpenChange(true); // Reopen the main modal
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            <img
              src={selectedImage}
              alt="Full view"
              className="w-full h-auto max-h-[95vh] object-contain"
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
        </DialogContent>
      </Dialog>
    </>
  );
}
