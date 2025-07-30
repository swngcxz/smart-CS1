import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface Collector {
  id: string;
  name: string;
  phone?: string;
}

export interface Schedule {
  location: string;
  type: string;
  time: string;          // HH:mm (24h)
  date: string;          // ISO yyyy-MM-dd (normalized)
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  capacity: string;      // "75%"
  collector?: Collector; // assigned collector
  truckPlate: string;
  priority?: "Low" | "Normal" | "High";
  notes?: string;
  contactPerson?: string;
}

interface AddScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchedule: (schedule: Schedule) => void;
  collectors: Collector[];
}

export function AddScheduleDialog({
  open,
  onOpenChange,
  onAddSchedule,
  collectors,
}: AddScheduleDialogProps) {
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState<Date>();
  const [capacity, setCapacity] = useState("");
  const [collectorId, setCollectorId] = useState<string>("");
  const [truckPlate, setTruckPlate] = useState("");
  const [status, setStatus] = useState<Schedule["status"]>("scheduled");
  const [priority, setPriority] = useState<Schedule["priority"]>("Normal");
  const [notes, setNotes] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const selectedCollector = useMemo(
    () => collectors.find((c) => c.id === collectorId),
    [collectors, collectorId]
  );

  const resetForm = () => {
    setLocation("");
    setType("");
    setTime("");
    setDate(undefined);
    setCapacity("");
    setCollectorId("");
    setTruckPlate("");
    setStatus("scheduled");
    setPriority("Normal");
    setNotes("");
    setContactPerson("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !type || !time || !date || !truckPlate) {
      // Basic required fields
      return;
    }

    // Capacity normalization (ensure trailing %)
    let normalizedCapacity = capacity.trim();
    if (normalizedCapacity) {
      // Allow numbers like "75" -> "75%"
      if (!normalizedCapacity.endsWith("%")) {
        normalizedCapacity = `${normalizedCapacity}%`;
      }
    } else {
      normalizedCapacity = "0%";
    }

    const newSchedule: Schedule = {
      location: location.trim(),
      type,
      time, // assumed HH:mm from <input type="time" />
      date: format(date, "yyyy-MM-dd"),
      status,
      capacity: normalizedCapacity,
      collector: selectedCollector,
      truckPlate: truckPlate.trim().toUpperCase(),
      priority,
      notes: notes.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
    };

    onAddSchedule(newSchedule);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Building A • North Wing"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Waste Type</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select waste type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                  <SelectItem value="Organic">Organic</SelectItem>
                  <SelectItem value="Recyclable">Recyclable</SelectItem>
                  <SelectItem value="Hazardous">Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Collection Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Collection Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

  
            <div className="grid gap-2">
              <Label htmlFor="collector">Assign Collector</Label>
              <Select value={collectorId} onValueChange={setCollectorId}>
                <SelectTrigger id="collector">
                  <SelectValue placeholder="Select collector" />
                </SelectTrigger>
                <SelectContent>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `• ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Schedule["status"])}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Schedule["priority"])}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="contactPerson">Contact Person (Optional)</Label>
              <Input
                id="contactPerson"
                placeholder="e.g., Mr. Lim (Facilities)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Landmark, access instruction, safety notice, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
