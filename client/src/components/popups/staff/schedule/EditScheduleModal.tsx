import { EditScheduleDialog } from "@/pages/staff/pages/EditScheduleDialog";
import { Schedule } from "@/pages/staff/pages/scheduleTypes";

interface EditScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  onUpdateSchedule: (schedule: Schedule) => void;
}

export function EditScheduleModal({ isOpen, onClose, schedule, onUpdateSchedule }: EditScheduleModalProps) {
  return (
    <EditScheduleDialog
      open={isOpen}
      onOpenChange={onClose}
      editingSchedule={schedule}
      onUpdateSchedule={onUpdateSchedule}
    />
  );
}
