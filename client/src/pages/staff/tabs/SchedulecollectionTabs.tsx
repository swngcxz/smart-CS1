import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { MapPin, Truck, Plus, Wrench, Trash2 } from "lucide-react";
import { format, isSameDay, parse, isBefore, startOfDay } from "date-fns";
import { AddScheduleDialog } from "../pages/AddScheduleDialog";
import { Schedule, Collector } from "../pages/scheduleTypes";
import { SchedulePopupModal } from "@/components/popups/staff/schedule/SchedulePopupModal";
import { useTruckSchedulesList, useCreateTruckSchedule, useUpdateTruckScheduleStatus } from "@/hooks/useTruckSchedules";
import { useCreateSchedule, useSchedulesList } from "@/hooks/useSchedules";
import { useStaffList } from "@/hooks/useStaff";

// Using shared Collector/Schedule from AddScheduleDialog

export function ScheduleCollectionTabs() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSchedulePopupOpen, setIsSchedulePopupOpen] = useState(false);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<Schedule[]>([]);
  const [scheduleData, setScheduleData] = useState<Schedule[]>([]);

  // Read: load schedules from backend
  const { data: truckSchedules, loading: truckLoading, error: truckError } = useTruckSchedulesList();
  const { data: regularSchedules, loading: regularLoading, error: regularError } = useSchedulesList();
  const { data: staffData } = useStaffList();

  // Debug logging
  console.log("🔍 ScheduleCollectionTabs data:", {
    truckSchedules: truckSchedules?.length || 0,
    regularSchedules: regularSchedules?.length || 0,
    staffData: staffData?.length || 0,
    truckLoading,
    regularLoading,
    truckError,
    regularError,
  });

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

    console.log("📅 Loaded schedules:", {
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

  const getSchedulesForDate = (date: Date) => {
    return scheduleData.filter((schedule) => isSameDay(new Date(schedule.date), date));
  };

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;

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
        `📅 ${day.toDateString()} has ${daySchedules.length} schedules:`,
        daySchedules.map((s) => ({
          serviceType: s.serviceType,
          location: s.location,
          time: s.time,
        }))
      );
    }

    return (
      <div className="w-full h-full p-1 flex flex-col items-center justify-start min-h-[80px] cursor-pointer">
        <span
          className={`text-sm font-medium mb-1 ${
            hasOverdueSchedules
              ? "w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center"
              : hasSchedules
              ? "w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center"
              : ""
          }`}
        >
          {day.getDate()}
        </span>

        {hasSchedules && (
          <div className="w-full space-y-1.5">
            {daySchedules.slice(0, 2).map((schedule, index) => {
              const effectiveStatus = getEffectiveStatus(schedule);
              const isOverdue = isScheduleOverdue(schedule);

              return (
                <div
                  key={index}
                  className={`text-xs px-2 py-1.5 rounded-lg text-center truncate flex items-center justify-center gap-1 shadow-sm transition-all duration-200 hover:scale-105 ${
                    schedule.serviceType === "collection" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  }`}
                  title={`${schedule.serviceType === "collection" ? "🗑️ Trash Collection" : "🔧 Maintenance"} - ${
                    schedule.location
                  } at ${schedule.time}${isOverdue ? " (OVERDUE)" : ""}`}
                >
                  <span className="truncate font-medium">{schedule.location}</span>
                </div>
              );
            })}
            {daySchedules.length > 2 && (
              <div className="text-xs text-gray-500 text-center font-medium bg-gray-100 rounded-full px-2 py-1 hover:bg-gray-200 transition-colors duration-200">
                +{daySchedules.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Create: POST to backend
  const [createBody, setCreateBody] = useState<any>(null);
  const [triggerCreate, setTriggerCreate] = useState(false);
  const { data: createRes, error: createErr } = useCreateTruckSchedule(createBody, triggerCreate);
  // Create (maintenance via /api/schedules)
  const [createMaintBody, setCreateMaintBody] = useState<any>(null);
  const [triggerCreateMaint, setTriggerCreateMaint] = useState(false);
  const { data: createMaintRes, error: createMaintErr } = useCreateSchedule(createMaintBody, triggerCreateMaint);
  useEffect(() => {
    if (!triggerCreate) return;
    if (createRes || createErr) {
      // If backend returned id, attach to last created optimistic schedule
      if (createRes?.id) {
        setScheduleData((prev) => {
          const next = [...prev];
          // Find last without id and set it
          for (let i = next.length - 1; i >= 0; i--) {
            if (!next[i].id) {
              next[i] = { ...next[i], id: createRes.id } as Schedule;
              break;
            }
          }
          return next;
        });
      }
      setTriggerCreate(false);
    }
  }, [createRes, createErr, triggerCreate]);

  // Surface create errors
  useEffect(() => {
    if (createErr) {
      console.error("Failed to create collection schedule:", createErr);

      // Remove the optimistic update on error
      setScheduleData((prev) => prev.filter((schedule) => schedule.id));

      // Show user-friendly error message
      const errorMessage =
        (createErr as any)?.response?.data?.error || (createErr as any)?.message || "Failed to create schedule";
      if (errorMessage.includes("already exists")) {
        console.warn("Schedule already exists for this driver on this date");
      } else {
        console.error("Unexpected error creating schedule:", errorMessage);
      }
    }
  }, [createErr]);

  useEffect(() => {
    if (!triggerCreateMaint) return;
    if (createMaintRes || createMaintErr) {
      if (createMaintRes?.id) {
        setScheduleData((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (!next[i].id) {
              next[i] = { ...next[i], id: createMaintRes.id } as Schedule;
              break;
            }
          }
          return next;
        });
      }
      setTriggerCreateMaint(false);
    }
  }, [createMaintRes, createMaintErr, triggerCreateMaint]);

  // Surface maintenance create errors
  useEffect(() => {
    if (createMaintErr) {
      console.error("Failed to create maintenance schedule:", createMaintErr);

      // Remove the optimistic update on error
      setScheduleData((prev) => prev.filter((schedule) => schedule.id));

      // Show user-friendly error message
      const errorMessage =
        (createMaintErr as any)?.response?.data?.error ||
        (createMaintErr as any)?.message ||
        "Failed to create schedule";
      if (errorMessage.includes("already exists")) {
        console.warn("Schedule already exists for this maintenance worker on this date");
      } else {
        console.error("Unexpected error creating maintenance schedule:", errorMessage);
      }
    }
  }, [createMaintErr]);

  const handleAddSchedule = (newSchedule: Omit<Schedule, "id">) => {
    // Validate driver selection (backend requires staffId)
    if (!newSchedule.collector?.id) {
      console.error("Please select a driver before saving the schedule.");
      // You can add a toast notification here instead if needed
      return;
    }
    // Optimistic UI
    setScheduleData((prev) => [...prev, newSchedule as Schedule]);

    // Route to correct backend
    const startTime = (newSchedule as any).start_collected || (newSchedule.time || "").split(" - ")[0];
    const endTime = (newSchedule as any).end_collected || (newSchedule.time || "").split(" - ")[1];

    if (newSchedule.serviceType === "collection") {
      const payload = {
        staffId: newSchedule.collector?.id,
        sched_type: newSchedule.serviceType,
        start_collected: startTime,
        end_collected: endTime,
        location: newSchedule.location,
        status: "scheduled",
        date: newSchedule.date,
        contactPerson: newSchedule.contactPerson,
        notes: newSchedule.notes,
        priority: newSchedule.priority,
        truckPlate: newSchedule.truckPlate,
      };
      console.log("🚛 Sending truck schedule payload:", payload);
      setCreateBody(payload);
      setTriggerCreate(true);
    } else {
      const payload = {
        staffId: newSchedule.collector?.id,
        sched_type: newSchedule.type,
        start_time: startTime,
        end_time: endTime,
        location: newSchedule.location,
        status: "scheduled",
        date: newSchedule.date,
        contactPerson: newSchedule.contactPerson,
        notes: newSchedule.notes,
        priority: newSchedule.priority,
      };
      console.log("🔧 Sending maintenance schedule payload:", payload);
      setCreateMaintBody(payload);
      setTriggerCreateMaint(true);
    }
  };

  // Update: PUT status
  const [updateTargetId, setUpdateTargetId] = useState<string | null>(null);
  const [updateStatusValue, setUpdateStatusValue] = useState<string>("");
  const [triggerUpdate, setTriggerUpdate] = useState(false);
  const { data: updateRes, error: updateErr } = useUpdateTruckScheduleStatus(
    updateTargetId,
    updateStatusValue,
    triggerUpdate
  );
  useEffect(() => {
    if (!triggerUpdate) return;
    if (updateRes || updateErr) {
      setTriggerUpdate(false);
    }
  }, [updateRes, updateErr, triggerUpdate]);

  // Surface update errors
  useEffect(() => {
    if (updateErr) {
      console.error("Failed to update schedule status:", updateErr);
      // Remove window.alert to prevent localhost notification
      // You can add a toast notification here instead if needed
    }
  }, [updateErr]);

  const handleUpdateStatus = (id: string | undefined, status: string) => {
    if (!id) return;
    // Optimistic
    setScheduleData((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: status as "scheduled" | "in-progress" | "completed" | "cancelled" } : s
      )
    );
    setUpdateTargetId(id);
    setUpdateStatusValue(status);
    setTriggerUpdate(true);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full border-transparent">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Schedules</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Trash Collection</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Maintenance</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-green-800 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Schedule
            </Button>
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

      {/* Schedule Popup Modal */}
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
      />

      <AddScheduleDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddSchedule={handleAddSchedule} />
    </div>
  );
}
