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
  
  // State for existing schedules validation
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [existingTruckSchedules, setExistingTruckSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  // Toast for notifications
  const { toast } = useToast();

  const availableCollectors: Collector[] = serviceType === "collection" ? drivers : maintenanceWorkers;
  const selectedCollector = availableCollectors.find((c) => c.id === collectorId);

  // Fetch drivers and maintenance workers when dialog opens
  useEffect(() => {
    if (open) {
      fetchWorkers();
      fetchExistingSchedules();
    }
  }, [open]);

  // Fetch workers when service type changes
  useEffect(() => {
    if (open) {
      setCollectorId(""); // Reset selected worker when service type changes
    }
  }, [serviceType, open]);

  // Clear validation error when form values change and perform real-time validation
  useEffect(() => {
    setValidationError("");
    
    // Perform real-time validation when all required fields are filled
    if (location && date && startTime && endTime && !loadingSchedules) {
      const hasDuplicate = checkForDuplicateSchedule();
      // Only show error if there's actually a duplicate, not on initial load
      if (hasDuplicate && (existingSchedules.length > 0 || existingTruckSchedules.length > 0)) {
        // Error is already set in checkForDuplicateSchedule function
      }
    }
  }, [location, date, startTime, endTime, collectorId, serviceType, existingSchedules, existingTruckSchedules, loadingSchedules]);

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

  const fetchExistingSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const [schedulesResponse, truckSchedulesResponse] = await Promise.all([
        api.get("/api/schedules"),
        api.get("/api/truck-schedules")
      ]);

      setExistingSchedules(schedulesResponse.data || []);
      setExistingTruckSchedules(truckSchedulesResponse.data || []);
    } catch (error) {
      console.error("Error fetching existing schedules:", error);
      setExistingSchedules([]);
      setExistingTruckSchedules([]);
    } finally {
      setLoadingSchedules(false);
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
    setValidationError("");
  };

  const checkForDuplicateSchedule = (): boolean => {
    if (!location || !date || !startTime || !endTime) {
      return false;
    }

    const formattedDate = format(date, "yyyy-MM-dd");
    const trimmedLocation = location.trim().toLowerCase();

    // Check for duplicates in the appropriate schedule type
    if (serviceType === "collection") {
      const duplicate = existingTruckSchedules.find(schedule => {
        const scheduleDate = schedule.date || schedule.start_date;
        const scheduleLocation = (schedule.location || "").toLowerCase();
        
        // Check if same location and date
        if (scheduleLocation === trimmedLocation && scheduleDate === formattedDate) {
          // Check for time overlap
          const scheduleStart = schedule.start_collected || schedule.start_time;
          const scheduleEnd = schedule.end_collected || schedule.end_time;
          
          if (scheduleStart && scheduleEnd) {
            // Check if times overlap (considering same worker or same location)
            return (
              (startTime >= scheduleStart && startTime < scheduleEnd) ||
              (endTime > scheduleStart && endTime <= scheduleEnd) ||
              (startTime <= scheduleStart && endTime >= scheduleEnd)
            );
          }
          // Even if no time overlap, still consider it a duplicate for the same location on same date
          return true;
        }
        return false;
      });

      if (duplicate) {
        const existingStart = duplicate.start_collected || duplicate.start_time;
        const existingEnd = duplicate.end_collected || duplicate.end_time;
        setValidationError(`A collection schedule already exists for "${location.trim()}" on ${format(date, "PPP")} from ${existingStart} to ${existingEnd}. Please choose a different time or location.`);
        return true;
      }
    } else {
      const duplicate = existingSchedules.find(schedule => {
        const scheduleDate = schedule.date || schedule.start_date;
        const scheduleLocation = (schedule.location || "").toLowerCase();
        
        // Check if same location and date
        if (scheduleLocation === trimmedLocation && scheduleDate === formattedDate) {
          // Check for time overlap
          const scheduleStart = schedule.start_time;
          const scheduleEnd = schedule.end_time;
          
          if (scheduleStart && scheduleEnd) {
            // Check if times overlap
            return (
              (startTime >= scheduleStart && startTime < scheduleEnd) ||
              (endTime > scheduleStart && endTime <= scheduleEnd) ||
              (startTime <= scheduleStart && endTime >= scheduleEnd)
            );
          }
          // Even if no time overlap, still consider it a duplicate for the same location on same date
          return true;
        }
        return false;
      });

      if (duplicate) {
        const existingStart = duplicate.start_time;
        const existingEnd = duplicate.end_time;
        setValidationError(`A maintenance schedule already exists for "${location.trim()}" on ${format(date, "PPP")} from ${existingStart} to ${existingEnd}. Please choose a different time or location.`);
        return true;
      }
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !startTime || !endTime || !date || !collectorId || collectorId === "loading" || collectorId === "no-workers") {
      return;
    }

    // Check for duplicate schedule before submitting
    if (checkForDuplicateSchedule()) {
      toast({
        variant: "destructive",
        title: "Duplicate Schedule",
        description: validationError,
      });
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

          {/* Validation Error Display */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
              disabled={!location || !startTime || !endTime || !date || !collectorId || collectorId === "loading" || collectorId === "no-workers" || loadingWorkers || loadingSchedules || !!validationError}
            >
              {loadingWorkers || loadingSchedules ? "Loading..." : "Add Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
