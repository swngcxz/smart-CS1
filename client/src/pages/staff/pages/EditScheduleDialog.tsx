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
        truckPlate: editingSchedule.truckPlate || "",
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

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Service Type Display (Read-only when editing) */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <span className="text-md font-medium text-gray-900 dark:text-white">
                {formData.serviceType === "collection" ? "Trash Collection" : "Maintenance"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Location and Date Section */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Building A • North Wing"
                  value={formData.location}
                  onChange={(e) => updateFormData({ location: e.target.value })}
                  className="h-9 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-sm",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
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
            </div>

            {/* Time Section */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startTime" className="text-sm text-gray-700">
                    Start Time
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startTime"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-sm",
                          !formData.startTime && "text-muted-foreground"
                        )}
                      >
                        {formData.startTime ? (
                          (() => {
                            const [hours, minutes] = formData.startTime.split(":");
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? "PM" : "AM";
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            return `${displayHour}:${minutes} ${ampm}`;
                          })()
                        ) : (
                          <span>Pick start time</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => updateFormData({ startTime: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime" className="text-sm text-gray-700">
                    End Time
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endTime"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9 text-sm",
                          !formData.endTime && "text-muted-foreground"
                        )}
                      >
                        {formData.endTime ? (
                          (() => {
                            const [hours, minutes] = formData.endTime.split(":");
                            const hour = parseInt(hours);
                            const ampm = hour >= 12 ? "PM" : "AM";
                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            return `${displayHour}:${minutes} ${ampm}`;
                          })()
                        ) : (
                          <span>Pick end time</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => updateFormData({ endTime: e.target.value })}
                          className="w-full"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Personnel Assignment & Contact */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="collector" className="text-sm font-medium text-gray-700">
                  {formData.serviceType === "collection" ? "Assign Driver" : "Assign Maintenance"}
                </Label>
                <select
                  id="collector"
                  value={formData.collectorId}
                  onChange={(e) => updateFormData({ collectorId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div className="space-y-1">
                <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                  Contact Person <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="contactPerson"
                  placeholder="e.g., Mr. Lim (Facilities)"
                  value={formData.contactPerson}
                  onChange={(e) => updateFormData({ contactPerson: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Notes Field */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes <span className="text-gray-400">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional instructions..."
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                rows={2}
                className="pt-2 text-sm"
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
