import { useMemo, useState } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AddScheduleDialog, Schedule, Collector } from "./AddScheduleDialog";
import { cn } from "@/lib/utils";

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

export function SchedulesBoard({ collectors = DEFAULT_COLLECTORS }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const onAddSchedule = (schedule: Schedule) => {
    setSchedules((prev) => [...prev, schedule]);
    // If the added schedule date is new, move calendar selection to it
    setSelectedDate(new Date(schedule.date));
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
              // react-day-picker classnames through shadcn Calendar
              // We'll add a little dot indicator for days with schedules
              className="pointer-events-auto"
              modifiers={{
                hasSchedule: (day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return datesWithSchedules.has(key);
                },
              }}
              modifiersClassNames={{
                hasSchedule: "relative has-schedule",
              }}
            />
          </div>

          {/* Small style hook for the dot (uses relative class above) */}
          <style>{`
            .has-schedule::after {
              content: "";
              position: absolute;
              bottom: 6px;
              left: 50%;
              transform: translateX(-50%);
              width: 6px;
              height: 6px;
              border-radius: 9999px;
              background: currentColor;
            }
          `}</style>
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
                  "rounded-lg border p-3",
                  s.priority === "High" && "border-destructive"
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
                  {s.priority ? (
                    <div>
                      Priority: <span className="font-medium">{s.priority}</span>
                    </div>
                  ) : null}
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
        collectors={collectors}
      />
    </div>
  );
}
