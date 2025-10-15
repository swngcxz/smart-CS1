import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { AddScheduleDialog, Schedule, Collector } from "./AddScheduleDialog";
import { cn } from "@/lib/utils";
import { useTruckSchedulesList, useCreateTruckSchedule } from "@/hooks/useTruckSchedules";
import { useStaffList } from "@/hooks/useStaff";

/**
 * Example list of collectors you can fetch from your API.
 * Pass your own via <SchedulesBoard collectors={...} />
 */
const DEFAULT_COLLECTORS: Collector[] = [
  { id: "c1", name: "Juan Dela Cruz", phone: "0917 000 1111" },
  { id: "c2", name: "Maria Santos", phone: "0917 222 3333" },
  { id: "c3", name: "Pedro Reyes", phone: "0917 444 5555" },
];

type Props = {
  collectors?: Collector[];
};

export function SchedulesBoard({ collectors: collectorsProp }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Load schedules from backend
  const { data: truckSchedules } = useTruckSchedulesList();

  useEffect(() => {
    if (!truckSchedules) return;
    const mapped: Schedule[] = (truckSchedules as any[]).map((t) => ({
      id: t.id,
      location: t.location,
      serviceType: (t.sched_type === "maintenance" ? "maintenance" : "collection"),
      type: t.sched_type,
      time: `${t.start_collected} - ${t.end_collected}`,
      date: t.date,
      status: t.status,
    }));
    setSchedules(mapped);
  }, [truckSchedules]);

  // Load staff and map drivers to collectors
  const { data: staffData } = useStaffList();
  const derivedCollectors: Collector[] = useMemo(() => {
    const list = Array.isArray(staffData) ? staffData : [];
    return list
      .filter((s: any) => (s.role || "").toLowerCase() === "driver")
      .map((s: any) => ({ id: s.id, name: s.fullName }));
  }, [staffData]);

  const collectors = collectorsProp && collectorsProp.length > 0 ? collectorsProp : derivedCollectors;

  // Create schedule
  const [createBody, setCreateBody] = useState<any>(null);
  const [triggerCreate, setTriggerCreate] = useState(false);
  const { data: createRes, error: createErr } = useCreateTruckSchedule(createBody, triggerCreate);

  useEffect(() => {
    if (!triggerCreate) return;
    // reset trigger after request completes (success or error)
    if (createRes || createErr) {
      setTriggerCreate(false);
    }
  }, [createRes, createErr, triggerCreate]);

  const onAddSchedule = (schedule: Schedule) => {
    // Optimistic UI
    setSchedules((prev) => [...prev, schedule]);
    setSelectedDate(new Date(schedule.date));

    // Build backend payload
    const payload = {
      staffId: schedule.collector?.id,
      sched_type: schedule.serviceType,
      start_collected: schedule.start_collected || schedule.time.split(" - ")[0],
      end_collected: schedule.end_collected || schedule.time.split(" - ")[1],
      location: schedule.location,
      status: "scheduled",
      date: schedule.date,
    };
    setCreateBody(payload);
    setTriggerCreate(true);
  };

  // Helper function to determine if a schedule is overdue
  const isScheduleOverdue = (schedule: Schedule) => {
    const today = startOfDay(new Date());
    const scheduleDate = startOfDay(new Date(schedule.date));
    return isBefore(scheduleDate, today) && schedule.status === "scheduled";
  };

  // Dates that have at least one schedule (for calendar highlighting)
  const datesWithSchedules = useMemo(() => {
    const set = new Set<string>();
    for (const s of schedules) {
      const d = format(new Date(s.date), "yyyy-MM-dd");
      set.add(d);
    }
    return set;
  }, [schedules]);

  // Dates that have overdue schedules
  const datesWithOverdueSchedules = useMemo(() => {
    const set = new Set<string>();
    for (const s of schedules) {
      if (isScheduleOverdue(s)) {
        const d = format(new Date(s.date), "yyyy-MM-dd");
        set.add(d);
      }
    }
    return set;
  }, [schedules]);

  // Custom day content component for the calendar
  const dayContent = (day: Date) => {
    const daySchedules = schedules.filter((s) => isSameDay(new Date(s.date), day));
    const hasSchedules = daySchedules.length > 0;
    const hasOverdueSchedules = daySchedules.some((schedule) => isScheduleOverdue(schedule));

    return (
      <div
        className={`w-full h-full flex items-center justify-center min-h-[80px] cursor-pointer rounded-md transition-all duration-200 ${
          hasOverdueSchedules
            ? "bg-red-100 hover:bg-red-200"
            : hasSchedules
            ? "bg-green-100 hover:bg-green-200"
            : "hover:bg-gray-50"
        }`}
        onClick={() => setSelectedDate(day)}
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

  const schedulesForSelected = useMemo(() => {
    if (!selectedDate) return [];
    return schedules
      .filter((s) => isSameDay(new Date(s.date), selectedDate))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules, selectedDate]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Collection Schedule</CardTitle>
          <Button onClick={() => setOpen(true)}>Add Schedule</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
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
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>
            {selectedDate ? `Schedules on ${format(selectedDate, "PPP")}` : "Pick a date"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedulesForSelected.length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules for this date.</p>
          ) : (
            schedulesForSelected.map((s, idx) => (
              <div
                key={`${s.location}-${s.time}-${idx}`}
                className={cn(
                  "rounded-lg border p-3"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {s.time} • {s.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{s.type}</Badge>
                    <Badge
                      variant={
                        s.status === "scheduled"
                          ? "default"
                          : s.status === "in-progress"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2 grid gap-1 text-sm">
                  <div>
                    Capacity: <span className="font-medium">{s.capacity}</span>
                  </div>
                  <div>
                    Collector:{" "}
                    <span className="font-medium">
                      {s.collector?.name ?? "Unassigned"}
                    </span>{" "}
                    {s.collector?.phone ? (
                      <span className="text-muted-foreground">({s.collector.phone})</span>
                    ) : null}
                  </div>
                  <div>
                    Truck Plate: <span className="font-medium">{s.truckPlate}</span>
                  </div>
                  {s.contactPerson ? (
                    <div>
                      Contact Person:{" "}
                      <span className="font-medium">{s.contactPerson}</span>
                    </div>
                  ) : null}
                  {/* Priority removed: not part of Schedule interface */}
                  {s.notes ? (
                    <div className="text-muted-foreground">Notes: {s.notes}</div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AddScheduleDialog
        open={open}
        onOpenChange={setOpen}
        onAddSchedule={onAddSchedule}
        drivers={collectors}
        maintenanceWorkers={[]}
      />
    </div>
  );
}
