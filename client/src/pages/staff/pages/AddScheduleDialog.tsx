import { useState } from "react";
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
import { CalendarIcon, Trash2, Wrench } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface Collector {
  id: string;
  name: string;
  phone?: string;
}

export interface Schedule {
  id?: number;
  location: string;
  serviceType: "collection" | "maintenance";
  type: string;
  time: string;      
  date: string;         
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  capacity?: string;      
  collector?: Collector; 
  truckPlate?: string;
  notes?: string;
  contactPerson?: string;
}

interface AddScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  collectors: Collector[];
}

export function AddScheduleDialog({
  open,
  onOpenChange,
  onAddSchedule,
  collectors,
}: AddScheduleDialogProps) {
  const [serviceType, setServiceType] = useState<"collection" | "maintenance">("collection");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState<Date>();
  const [capacity, setCapacity] = useState("");
  const [collectorId, setCollectorId] = useState<string>("");
  const [truckPlate, setTruckPlate] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  const selectedCollector = collectors.find((c) => c.id === collectorId);

  const resetForm = () => {
    setServiceType("collection");
    setLocation("");
    setType("");
    setTime("");
    setDate(undefined);
    setCapacity("");
    setCollectorId("");
    setTruckPlate("");
    setNotes("");
    setContactPerson("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !type || !time || !date) {
      return;
    }

    // Capacity is only relevant for collection
    let normalizedCapacity = "";
    if (serviceType === "collection" && capacity.trim()) {
      normalizedCapacity = capacity.trim();
      if (!normalizedCapacity.endsWith("%")) {
        normalizedCapacity = `${normalizedCapacity}%`;
      }
    }

    const newSchedule: Omit<Schedule, 'id'> = {
      serviceType,
      location: location.trim(),
      type,
      time,
      date: format(date, "yyyy-MM-dd"),
      status: "scheduled",
      capacity: normalizedCapacity || undefined,
      collector: selectedCollector,
      truckPlate: truckPlate.trim().toUpperCase() || undefined,
      notes: notes.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
    };

    onAddSchedule(newSchedule);
    resetForm();
    onOpenChange(false);
  };

  const getTypeOptions = () => {
    if (serviceType === "collection") {
      return [
        { value: "Mixed", label: "Mixed Waste" },
        { value: "Organic", label: "Organic" },
        { value: "Recyclable", label: "Recyclable" },
        { value: "Hazardous", label: "Hazardous" },
      ];
    } else {
      return [
        { value: "Repair", label: "Bin Repair" },
        { value: "Replacement", label: "Bin Replacement" },
        { value: "Cleaning", label: "Deep Cleaning" },
        { value: "Inspection", label: "Inspection" },
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Type Selection */}
          <div className="grid gap-3">
            <Label>Service Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  serviceType === "collection" ? "ring-2 ring-primary bg-primary/5" : "border-border"
                )}
                onClick={() => setServiceType("collection")}
              >
                <CardContent className="flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="font-medium">Trash Collection</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  serviceType === "maintenance" ? "ring-2 ring-primary bg-primary/5" : "border-border"
                )}
                onClick={() => setServiceType("maintenance")}
              >
                <CardContent className="flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="font-medium">Maintenance</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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
              <Label htmlFor="type">
                {serviceType === "collection" ? "Waste Type" : "Service Type"}
              </Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder={`Select ${serviceType === "collection" ? "waste" : "service"} type`} />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
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
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            {serviceType === "collection" && (
              <div className="grid gap-2">
                <Label htmlFor="capacity">Expected Capacity (%)</Label>
                <Input
                  id="capacity"
                  placeholder="75"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="collector">Assign Worker</Label>
              <Select value={collectorId} onValueChange={setCollectorId}>
                <SelectTrigger id="collector">
                  <SelectValue placeholder="Select worker" />
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional instructions or information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition">Add Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}