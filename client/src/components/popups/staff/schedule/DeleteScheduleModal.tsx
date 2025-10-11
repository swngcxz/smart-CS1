import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, MapPin } from "lucide-react";
import { Schedule } from "@/pages/staff/pages/scheduleTypes";

interface DeleteScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onConfirm: () => void;
  formatTimeRange: (time: string) => string;
}

export function DeleteScheduleModal({
  isOpen,
  onClose,
  schedule,
  onConfirm,
  formatTimeRange,
}: DeleteScheduleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">Delete Schedule</DialogTitle>
          <DialogDescription className="text-base">Are you sure you want to delete this schedule?</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Schedule Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                <p className="font-semibold text-gray-900 text-lg">{schedule?.location}</p>
              </div>
              {schedule?.serviceType && (
                <div className="ml-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      schedule.serviceType === "collection"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {schedule.serviceType === "collection" ? "Trash Collection" : "Maintenance"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Warning</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  This action cannot be undone. The schedule will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} variant="destructive" className="flex-1">
              Delete Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
