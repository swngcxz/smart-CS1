import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parse, isBefore, startOfDay } from "date-fns";
import { Schedule, Collector } from "../../staff/pages/scheduleTypes";
import { SchedulePopupModal } from "@/components/popups/staff/schedule/SchedulePopupModal";
import { useTruckSchedulesList } from "@/hooks/useTruckSchedules";
import { useSchedulesList } from "@/hooks/useSchedules";
import { useStaffList } from "@/hooks/useStaff";

// Using shared Schedule interface from AddScheduleDialog

export function ScheduleCollectionTabs() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSchedulePopupOpen, setIsSchedulePopupOpen] = useState(false);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<Schedule[]>([]);
  const [scheduleData, setScheduleData] = useState<Schedule[]>([]);

  // Read: load schedules from backend
  const { data: truckSchedules, loading: truckLoading, error: truckError } = useTruckSchedulesList();
  const { data: regularSchedules, loading: regularLoading, error: regularError } = useSchedulesList();
  const { data: staffData } = useStaffList();

  // Debug logging
  console.log("Admin ScheduleCollectionTabs data:", {
    truckSchedules: truckSchedules?.length || 0,
    regularSchedules: regularSchedules?.length || 0,
    staffData: staffData?.length || 0,
    truckLoading,
    regularLoading,
    truckError,
    regularError,
  });

  useEffect(() => {
    const allSchedules: Schedule[] = [];

    // Load truck schedules (collection)
    if (truckSchedules) {
      const truckMapped: Schedule[] = (truckSchedules as any[]).map((t) => {
        // Find the staff member by staffId
        const staffMember = staffData?.find((s: any) => s.id === t.staffId);
        return {
          id: t.id,
          location: t.location,
          serviceType: "collection",
          type: t.sched_type,
          time: `${t.start_collected} - ${t.end_collected}`,
          date: t.date,
          status: t.status as "scheduled" | "in-progress" | "completed" | "cancelled",
          collector: staffMember
            ? { id: staffMember.id, name: staffMember.fullName, phone: staffMember.phone }
            : undefined,
          truckPlate: t.truckPlate,
          notes: t.notes,
          contactPerson: t.contactPerson,
          priority: t.priority,
        };
      });
      allSchedules.push(...truckMapped);
    }

    // Load regular schedules (maintenance)
    if (regularSchedules) {
      const regularMapped: Schedule[] = (regularSchedules as any[]).map((s) => {
        // Find the staff member by staffId
        const staffMember = staffData?.find((staff: any) => staff.id === s.staffId);
        return {
          id: s.id,
          location: s.location,
          serviceType: "maintenance",
          type: s.sched_type,
          time: `${s.start_time} - ${s.end_time}`,
          date: s.date,
          status: s.status as "scheduled" | "in-progress" | "completed" | "cancelled",
          collector: staffMember
            ? { id: staffMember.id, name: staffMember.fullName, phone: staffMember.phone }
            : undefined,
          notes: s.notes,
          contactPerson: s.contactPerson,
          priority: s.priority,
        };
      });
      allSchedules.push(...regularMapped);
    }

    console.log("Admin Loaded schedules:", {
      truckSchedules: truckSchedules?.length || 0,
      regularSchedules: regularSchedules?.length || 0,
      totalSchedules: allSchedules.length,
      schedules: allSchedules.map((s) => ({
        id: s.id,
        date: s.date,
        serviceType: s.serviceType,
        location: s.location,
      })),
    });

    setScheduleData(allSchedules);
  }, [truckSchedules, regularSchedules, staffData]);

  // Load staff and derive drivers as collectors
  const drivers: Collector[] = useMemo(() => {
    const list = Array.isArray(staffData) ? staffData : [];
    const drivers = list
      .filter((s: any) => (s.role || "").toLowerCase() === "driver")
      .map((s: any) => ({ id: s.id, name: s.fullName }));
    return drivers;
  }, [staffData]);

  const maintenanceWorkers: Collector[] = useMemo(() => {
    const list = Array.isArray(staffData) ? staffData : [];
    return list
      .filter((s: any) => (s.role || "").toLowerCase() === "maintenance")
      .map((s: any) => ({ id: s.id, name: s.fullName }));
  }, [staffData]);

  // Helper function to determine if a schedule is overdue
  const isScheduleOverdue = (schedule: Schedule) => {
    const today = startOfDay(new Date());
    const scheduleDate = startOfDay(new Date(schedule.date));

    // A schedule is overdue if:
    // 1. The schedule date is before today AND
    // 2. The status is still "scheduled" (not completed or cancelled)
    return isBefore(scheduleDate, today) && schedule.status === "scheduled";
  };

  // Helper function to get the effective status (including overdue)
  const getEffectiveStatus = (schedule: Schedule) => {
    if (isScheduleOverdue(schedule)) {
      return "overdue";
    }
    return schedule.status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCapacityColor = (capacity: string) => {
    const numCapacity = parseInt(capacity);
    if (numCapacity >= 80) return "text-red-600";
    if (numCapacity >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  const getServiceTypeColor = (serviceType: string) => {
    return serviceType === "collection" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
  };

  function formatTimeRange(timeRange: string) {
    if (!timeRange || typeof timeRange !== "string") {
      return "Time not specified";
    }

    const timeParts = timeRange.split(" - ");
    if (timeParts.length !== 2) {
      return timeRange; // Return original if format is unexpected
    }

    const [start, end] = timeParts;
    if (!start || !end) {
      return timeRange; // Return original if parts are missing
    }

    try {
      const startDate = parse(start, "HH:mm", new Date());
      const endDate = parse(end, "HH:mm", new Date());
      return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
    } catch (error) {
      console.warn("Error formatting time range:", timeRange, error);
      return timeRange; // Return original on parse error
    }
  }

  const getSchedulesForDate = (date: Date) => {
    return scheduleData.filter((schedule) => isSameDay(new Date(schedule.date), date));
  };

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;

    // If clicking on the same date that's already selected, toggle the modal
    if (selectedDate && isSameDay(date, selectedDate) && isSchedulePopupOpen) {
      setIsSchedulePopupOpen(false);
      return;
    }

    const daySchedules = getSchedulesForDate(date);
    setSelectedDateSchedules(daySchedules);
    setIsSchedulePopupOpen(true);
    setSelectedDate(date);
  };

  const dayContent = (day: Date) => {
    const daySchedules = getSchedulesForDate(day);
    const hasSchedules = daySchedules.length > 0;
    const hasOverdueSchedules = daySchedules.some((schedule) => isScheduleOverdue(schedule));

    // Debug logging for specific dates
    if (hasSchedules) {
      console.log(
        `Admin ${day.toDateString()} has ${daySchedules.length} schedules:`,
        daySchedules.map((s) => ({
          serviceType: s.serviceType,
          location: s.location,
          time: s.time,
        }))
      );
    }

    return (
      <div
        className={`w-full h-full p-1 flex items-center justify-center min-h-[80px] cursor-pointer rounded-md transition-all duration-200 ${
          hasOverdueSchedules
            ? "bg-red-100 hover:bg-red-200"
            : hasSchedules
            ? "bg-green-100 hover:bg-green-200"
            : "hover:bg-gray-50"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          handleDateClick(day);
        }}
        title={
          hasSchedules
            ? `${daySchedules.length} schedule${daySchedules.length > 1 ? "s" : ""} on this day${
                hasOverdueSchedules ? " (OVERDUE)" : ""
              }`
            : undefined
        }
      >
        <span
          className={`text-sm font-medium ${
            hasOverdueSchedules
              ? "text-red-700"
              : hasSchedules
              ? "text-green-700"
              : ""
          }`}
        >
          {day.getDate()}
        </span>
      </div>
    );
  };

  return (
    <div>
      <Card className="w-full border-transparent">
        <CardHeader className="pb-4 pt-0">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Schedules</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            className="w-full rounded-md border pointer-events-auto"
            classNames={{
              months: "flex flex-col w-full space-y-6",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-2 relative items-center mb-4",
              caption_label: "text-xl font-semibold",
              nav: "space-x-2 flex items-center",
              nav_button:
                "h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-gray-100 rounded-md transition-all duration-200",
              nav_button_previous: "absolute left-2",
              nav_button_next: "absolute right-2",
              table: "w-full border-collapse space-y-2",
              head_row: "flex w-full border-b pb-2 mb-4",
              head_cell: "text-muted-foreground rounded-md flex-1 font-semibold text-center py-2 text-sm",
              row: "flex w-full mt-2",
              cell: "flex-1 text-center p-1 relative border border-gray-100 min-h-[100px]",
              day: "w-full h-full p-0 font-normal hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-none",
              day_selected:
                "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary",
              day_today: "bg-accent text-accent-foreground font-bold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-30",
            }}
            components={{
              DayContent: ({ date }) => dayContent(date),
            }}
          />
        </CardContent>
      </Card>
      {/* Schedule Popup Modal - View Only for Admin */}
      <SchedulePopupModal
        isOpen={isSchedulePopupOpen}
        onClose={() => setIsSchedulePopupOpen(false)}
        selectedDate={selectedDate}
        schedules={selectedDateSchedules}
        getEffectiveStatus={getEffectiveStatus}
        isScheduleOverdue={isScheduleOverdue}
        getStatusColor={getStatusColor}
        getCapacityColor={getCapacityColor}
        formatTimeRange={formatTimeRange}
        viewOnly={true}
      />
    </div>
  );
}
