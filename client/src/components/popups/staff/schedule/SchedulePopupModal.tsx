import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Phone, MessageSquare, Calendar, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Schedule } from "@/pages/staff/pages/scheduleTypes";
import { useState } from "react";
import { EditScheduleModal } from "./EditScheduleModal";
import { DeleteScheduleModal } from "./DeleteScheduleModal";

interface SchedulePopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | undefined;
  schedules: Schedule[];
  getEffectiveStatus: (schedule: Schedule) => string;
  isScheduleOverdue: (schedule: Schedule) => boolean;
  getStatusColor: (status: string) => string;
  getCapacityColor: (capacity: string) => string;
  formatTimeRange: (timeRange: string) => string;
  viewOnly?: boolean; // New prop for admin view-only mode
}

// Helper function to get profile picture or initials
const getProfilePicture = (name: string) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm">
      {initials}
    </div>
  );
};

export function SchedulePopupModal({
  isOpen,
  onClose,
  selectedDate,
  schedules,
  getEffectiveStatus,
  isScheduleOverdue,
  getStatusColor,
  getCapacityColor,
  formatTimeRange,
  viewOnly = false, // Default to false for staff
}: SchedulePopupModalProps) {
  const [activeTab, setActiveTab] = useState<"collection" | "maintenance">("collection");
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);

  // Get counts for tabs
  const collectionCount = schedules.filter((s) => s.serviceType === "collection").length;
  const maintenanceCount = schedules.filter((s) => s.serviceType === "maintenance").length;

  // Show tabs only if there are schedules for both types
  const showTabs = collectionCount > 0 && maintenanceCount > 0;

  // Filter schedules based on active tab (show all if tabs are hidden)
  const filteredSchedules = showTabs ? schedules.filter((schedule) => schedule.serviceType === activeTab) : schedules;

  // Handler functions
  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
  };

  const handleUpdateSchedule = (updatedSchedule: Schedule) => {
    // TODO: Implement actual update functionality
    console.log("Updating schedule:", updatedSchedule);
    setEditingSchedule(null);
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    setDeletingSchedule(schedule);
  };

  const confirmDelete = () => {
    // TODO: Implement actual delete functionality
    console.log("Deleting schedule:", deletingSchedule);
    setDeletingSchedule(null);
  };

  const cancelDelete = () => {
    setDeletingSchedule(null);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[93vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            Schedules for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {schedules.length} Schedule{schedules.length > 1 ? "s" : ""} for this date
          </DialogDescription>
        </DialogHeader>
        {/* Modern Tab Navigation - Only show if there are both types */}
        {showTabs && (
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("collection")}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "collection"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Trash Collection
                <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                  {collectionCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "maintenance"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Maintenance
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {maintenanceCount}
                </span>
              </button>
            </nav>
          </div>
        )}

        <div className="space-y-4">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No {activeTab} schedules for this date</p>
              <p className="text-sm text-gray-400 mt-2">Click "Add Schedule" to create a new schedule</p>
            </div>
          ) : (
            filteredSchedules.map((schedule) => {
              const effectiveStatus = getEffectiveStatus(schedule);
              const isOverdue = isScheduleOverdue(schedule);

              return (
                <div key={schedule.id} className="bg-white border border-none rounded-xl">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-900">{schedule.location}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${
                          isOverdue
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        } border`}
                      >
                        {isOverdue ? "Overdue" : effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                      </Badge>
                      {!viewOnly && (
                        <>
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="p-1 hover:bg-red-100 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Schedule Information Grid */}
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    {/* Schedule Time */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                            Schedule Time
                          </p>
                          <p className="text-md font-semibold text-gray-900">{formatTimeRange(schedule.time)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Personnel & Contact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Assigned Personnel */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Assigned Personnel
                          </p>
                        </div>
                        {schedule.collector ? (
                          <div className="flex items-center gap-3">
                            {getProfilePicture(schedule.collector.name)}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{schedule.collector.name}</p>
                              {schedule.collector.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Phone className="h-3 w-3" />
                                  {schedule.collector.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                            <span className="text-sm text-gray-500 italic">Not assigned</span>
                          </div>
                        )}
                      </div>

                      {/* Contact Person */}
                      {schedule.contactPerson && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <Phone className="h-4 w-4 text-gray-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Contact Person</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-xs">
                              {schedule.contactPerson
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{schedule.contactPerson}</p>
                              <p className="text-xs text-gray-500">Contact</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {schedule.notes && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-gray-600" />
                        </div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Notes</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-800 leading-relaxed">{schedule.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Capacity */}
                  {schedule.capacity && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">📊</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                              {schedule.status === "completed" ? "Collected" : "Expected Capacity"}
                            </p>
                            <p className="text-lg font-bold text-gray-900">{schedule.capacity}</p>
                          </div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getCapacityColor(
                            schedule.capacity
                          )}`}
                        >
                          {schedule.capacity}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>

      {/* Edit Schedule Modal - Only show for staff */}
      {!viewOnly && (
        <EditScheduleModal
          isOpen={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          schedule={editingSchedule}
          onUpdateSchedule={handleUpdateSchedule}
        />
      )}

      {/* Delete Confirmation Modal - Only show for staff */}
      {!viewOnly && (
        <DeleteScheduleModal
          isOpen={!!deletingSchedule}
          onClose={cancelDelete}
          schedule={deletingSchedule}
          onConfirm={confirmDelete}
          formatTimeRange={formatTimeRange}
        />
      )}
    </Dialog>
  );
}
