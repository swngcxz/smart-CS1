import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export interface Collector {
  id: string;
  name: string;
  phone?: string;
}

export interface Schedule {
  id?: string;
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
  start_collected?: string;
  end_collected?: string;
  priority?: "Low" | "Normal" | "High";
}

interface AddScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchedule: (schedule: Omit<Schedule, "id">) => void;
}

export function AddScheduleDialog({
  open,
  onOpenChange,
  onAddSchedule,
}: AddScheduleDialogProps) {
  const [serviceType, setServiceType] = useState<"collection" | "maintenance">("collection");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [date, setDate] = useState<Date>();
  const [capacity, setCapacity] = useState("");
  const [collectorId, setCollectorId] = useState<string>("");
  const [truckPlate, setTruckPlate] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [priority, setPriority] = useState<"Low" | "Normal" | "High">("Normal");
  
  // State for fetching workers
  const [drivers, setDrivers] = useState<Collector[]>([]);
  const [maintenanceWorkers, setMaintenanceWorkers] = useState<Collector[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  
  // Toast for notifications
  const { toast } = useToast();

  const availableCollectors: Collector[] = serviceType === "collection" ? drivers : maintenanceWorkers;
  const selectedCollector = availableCollectors.find((c) => c.id === collectorId);

  // Fetch drivers and maintenance workers when dialog opens
  useEffect(() => {
    if (open) {
      fetchWorkers();
    }
  }, [open]);

  // Fetch workers when service type changes
  useEffect(() => {
    if (open) {
      setCollectorId(""); // Reset selected worker when service type changes
    }
  }, [serviceType, open]);

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const [driversResponse, maintenanceResponse] = await Promise.all([
        api.get("/api/staff/drivers"),
        api.get("/api/staff/maintenance")
      ]);

      setDrivers(driversResponse.data || []);
      setMaintenanceWorkers(maintenanceResponse.data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      setDrivers([]);
      setMaintenanceWorkers([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workers. Please try again.",
      });
    } finally {
      setLoadingWorkers(false);
    }
  };

  const resetForm = () => {
    setServiceType("collection");
    setLocation("");
    setType("");
    setStartTime("");
    setEndTime("");
    setDate(undefined);
    setCapacity("");
    setCollectorId("");
    setTruckPlate("");
    setNotes("");
    setContactPerson("");
    setPriority("Normal");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !startTime || !endTime || !date || !collectorId || collectorId === "loading" || collectorId === "no-workers") {
      return;
    }

    try {
      let response;
      
      if (serviceType === "collection") {
        // Use truck-schedules endpoint for collection
        const scheduleData = {
          staffId: collectorId,
          sched_type: "collection",
          start_collected: startTime,
          end_collected: endTime,
          location: location.trim(),
          status: "scheduled",
          date: format(date, "yyyy-MM-dd"),
          priority: priority,
          ...(notes.trim() && { notes: notes.trim() }),
          ...(contactPerson.trim() && { contactPerson: contactPerson.trim() }),
          ...(truckPlate.trim() && { truckPlate: truckPlate.trim().toUpperCase() })
        };
        
        response = await api.post("/api/truck-schedules", scheduleData);
      } else {
        // Use regular schedules endpoint for maintenance
        const scheduleData = {
          staffId: collectorId,
          sched_type: "maintenance",
          start_time: startTime,
          end_time: endTime,
          location: location.trim(),
          status: "scheduled",
          date: format(date, "yyyy-MM-dd"),
          priority: priority,
          lunch_break_start: "12:00",
          lunch_break_end: "13:00",
          ...(notes.trim() && { notes: notes.trim() }),
          ...(contactPerson.trim() && { contactPerson: contactPerson.trim() })
        };
        
        response = await api.post("/api/schedules", scheduleData);
      }

      if (response.status === 201) {
        // Create schedule object for frontend
        const newSchedule: Omit<Schedule, "id"> = {
          serviceType,
          location: location.trim(),
          type: serviceType,
          time: startTime,
          date: format(date, "yyyy-MM-dd"),
          status: "scheduled",
          collector: selectedCollector,
          notes: notes.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          start_collected: startTime,
          end_collected: endTime,
          priority,
          ...(truckPlate.trim() && { truckPlate: truckPlate.trim().toUpperCase() })
        };

        onAddSchedule(newSchedule);
        resetForm();
        onOpenChange(false);
        
        toast({
          variant: "success",
          title: "Success",
          description: `${serviceType === "collection" ? "Trash collection" : "Maintenance"} schedule created successfully!`,
        });
      }
    } catch (error: any) {
      console.error("Error creating schedule:", error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || "Failed to create schedule";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
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
            {/* 
            <div className="grid gap-2">
              <Label htmlFor="type">{serviceType === "collection" ? "Waste Type" : "Service Type"}</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger id="type">
                  <SelectValue placeholder={`Select ${serviceType === "collection" ? "waste" : "service"} type`} />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
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
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="collector">{serviceType === "collection" ? "Assign Driver" : "Assign Maintenance"}</Label>
              <Select value={collectorId} onValueChange={setCollectorId}>
                <SelectTrigger id="collector">
                  <SelectValue placeholder={loadingWorkers ? "Loading workers..." : "Select worker"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingWorkers ? (
                    <SelectItem value="loading" disabled>
                      Loading workers...
                    </SelectItem>
                  ) : availableCollectors.length === 0 ? (
                    <SelectItem value="no-workers" disabled>
                      No {serviceType === "collection" ? "drivers" : "maintenance workers"} available
                    </SelectItem>
                  ) : (
                    availableCollectors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone ? `• ${c.phone}` : ""}
                      </SelectItem>
                    ))
                  )}
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
            <Button 
              type="submit" 
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
              disabled={!location || !startTime || !endTime || !date || !collectorId || collectorId === "loading" || collectorId === "no-workers" || loadingWorkers}
            >
              {loadingWorkers ? "Loading..." : "Add Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
