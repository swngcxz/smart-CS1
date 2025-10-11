import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Schedule, Collector } from "./scheduleTypes";
import { useScheduleFormState } from "./scheduleFormUtils";

interface EditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSchedule: (schedule: Schedule) => void;
  editingSchedule: Schedule | null;
}

export function EditScheduleDialog({ open, onOpenChange, onUpdateSchedule, editingSchedule }: EditScheduleDialogProps) {
  const [formData, setFormData] = useState({
    serviceType: "collection" as "collection" | "maintenance",
    location: "",
    type: "",
    startTime: "",
    endTime: "",
    date: undefined as Date | undefined,
    capacity: "",
    collectorId: "",
    truckPlate: "",
    notes: "",
    contactPerson: "",
    priority: "Normal" as "Low" | "Normal" | "High",
  });

  const [drivers, setDrivers] = useState<Collector[]>([]);
  const [maintenanceWorkers, setMaintenanceWorkers] = useState<Collector[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [existingTruckSchedules, setExistingTruckSchedules] = useState<any[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { fetchWorkers, submitSchedule } = useScheduleFormState();

  const availableCollectors: Collector[] = formData.serviceType === "collection" ? drivers : maintenanceWorkers;
  const selectedCollector = availableCollectors.find((c) => c.id === formData.collectorId);

  // Fetch workers when dialog opens
  useEffect(() => {
    if (open) {
      fetchWorkers(setDrivers, setMaintenanceWorkers, setLoadingWorkers);
    }
  }, [open]);

  // Populate form when editing a schedule
  useEffect(() => {
    if (editingSchedule && open) {
      setFormData({
        serviceType: editingSchedule.serviceType,
        location: editingSchedule.location,
        type: editingSchedule.type,

        // Handle time format - could be stored as "HH:mm" or "HH:mm - HH:mm"
        startTime: editingSchedule.time.includes(" - ") ? editingSchedule.time.split(" - ")[0] : editingSchedule.time,
        endTime: editingSchedule.time.includes(" - ")
          ? editingSchedule.time.split(" - ")[1]
          : editingSchedule.end_collected || "",

        // Set date
        date: editingSchedule.date ? new Date(editingSchedule.date) : undefined,

        capacity: editingSchedule.capacity || "",
        notes: editingSchedule.notes || "",
        contactPerson: editingSchedule.contactPerson || "",
        priority: editingSchedule.priority || "Normal",

        // Set collector ID if available
        collectorId: editingSchedule.collector?.id || "",
      });
      setValidationError("");
    }
  }, [editingSchedule, open]);

  const resetForm = () => {
    setFormData({
      serviceType: "collection",
      location: "",
      type: "",
      startTime: "",
      endTime: "",
      date: undefined,
      capacity: "",
      collectorId: "",
      truckPlate: "",
      notes: "",
      contactPerson: "",
      priority: "Normal",
    });
    setValidationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.location ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.date ||
      !formData.collectorId ||
      formData.collectorId === "loading" ||
      formData.collectorId === "no-workers"
    ) {
      return;
    }

    const success = await submitSchedule(formData, selectedCollector, true, editingSchedule, (schedule) => {
      onUpdateSchedule(schedule);
      resetForm();
      onOpenChange(false);
    });

    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Type Selection */}
          <div className="grid gap-3">
            <Label>Service Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  formData.serviceType === "collection" ? "ring-2 ring-primary bg-primary/5" : "border-border"
                )}
                onClick={() => updateFormData({ serviceType: "collection" })}
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
                  formData.serviceType === "maintenance" ? "ring-2 ring-primary bg-primary/5" : "border-border"
                )}
                onClick={() => updateFormData({ serviceType: "maintenance" })}
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
                value={formData.location}
                onChange={(e) => updateFormData({ location: e.target.value })}
                required
              />
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
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => updateFormData({ date })}
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
                value={formData.startTime}
                onChange={(e) => updateFormData({ startTime: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateFormData({ endTime: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="collector">
                {formData.serviceType === "collection" ? "Assign Driver" : "Assign Maintenance"}
              </Label>
              <select
                id="collector"
                value={formData.collectorId}
                onChange={(e) => updateFormData({ collectorId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">{loadingWorkers ? "Loading workers..." : "Select worker"}</option>
                {loadingWorkers ? (
                  <option value="loading" disabled>
                    Loading workers...
                  </option>
                ) : availableCollectors.length === 0 ? (
                  <option value="no-workers" disabled>
                    No {formData.serviceType === "collection" ? "drivers" : "maintenance workers"} available
                  </option>
                ) : (
                  availableCollectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `• ${c.phone}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="contactPerson">Contact Person (Optional)</Label>
              <Input
                id="contactPerson"
                placeholder="e.g., Mr. Lim (Facilities)"
                value={formData.contactPerson}
                onChange={(e) => updateFormData({ contactPerson: e.target.value })}
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional instructions or information..."
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
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
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
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
              disabled={
                !formData.location ||
                !formData.startTime ||
                !formData.endTime ||
                !formData.date ||
                !formData.collectorId ||
                formData.collectorId === "loading" ||
                formData.collectorId === "no-workers" ||
                loadingWorkers ||
                loadingSchedules ||
                !!validationError
              }
            >
              {loadingWorkers ? "Loading..." : "Update Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
