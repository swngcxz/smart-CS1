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

interface AddScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSchedule: (schedule: Omit<Schedule, "id">) => void;
}

export function AddScheduleDialog({ open, onOpenChange, onAddSchedule }: AddScheduleDialogProps) {
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

  const { fetchWorkers, fetchExistingSchedules, checkForPastDate, checkForDuplicateSchedule, submitSchedule } =
    useScheduleFormState();

  const availableCollectors: Collector[] = formData.serviceType === "collection" ? drivers : maintenanceWorkers;
  const selectedCollector = availableCollectors.find((c) => c.id === formData.collectorId);

  // Fetch workers and existing schedules when dialog opens
  useEffect(() => {
    if (open) {
      fetchWorkers(setDrivers, setMaintenanceWorkers, setLoadingWorkers);
      fetchExistingSchedules(setExistingSchedules, setExistingTruckSchedules, setLoadingSchedules);
    }
  }, [open]);

  // Reset collector when service type changes
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({ ...prev, collectorId: "" }));
    }
  }, [formData.serviceType, open]);

  // Real-time validation
  useEffect(() => {
    setValidationError("");

    if (formData.date) {
      if (checkForPastDate(formData.date, setValidationError)) {
        return;
      }
    }

    if (formData.location && formData.date && formData.startTime && formData.endTime && !loadingSchedules) {
      const hasDuplicate = checkForDuplicateSchedule(
        formData,
        existingSchedules,
        existingTruckSchedules,
        setValidationError
      );
      if (hasDuplicate && (existingSchedules.length > 0 || existingTruckSchedules.length > 0)) {
        // Error is already set in checkForDuplicateSchedule function
      }
    }
  }, [
    formData.location,
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.collectorId,
    formData.serviceType,
    existingSchedules,
    existingTruckSchedules,
    loadingSchedules,
  ]);

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

    const success = await submitSchedule(formData, selectedCollector, false, null, (schedule) => {
      onAddSchedule(schedule);
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
          <DialogTitle>Add New Schedule</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Create a new schedule for trash collection or maintenance services
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Service Type Selection */}
          <div className="grid gap-3">
            <Label>Service Type</Label>
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium text-center transition-colors duration-200 relative",
                  formData.serviceType === "collection"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => updateFormData({ serviceType: "collection" })}
              >
                Trash Collection
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium text-center transition-colors duration-200 relative",
                  formData.serviceType === "maintenance"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => updateFormData({ serviceType: "maintenance" })}
              >
                Maintenance
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Location and Date Section */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location *
                </Label>
                <div className="relative">
                  <Input
                    id="location"
                    placeholder="Building A • North Wing"
                    value={formData.location}
                    onChange={(e) => updateFormData({ location: e.target.value })}
                    className="pl-9 h-9 text-sm"
                    required
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 pl-9 text-sm",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Schedule Duration *</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="startTime" className="text-xs text-gray-500">
                    Start Time
                  </Label>
                  <div className="relative">
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => updateFormData({ startTime: e.target.value })}
                      className="pl-9 h-9 text-sm"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endTime" className="text-xs text-gray-500">
                    End Time
                  </Label>
                  <div className="relative">
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => updateFormData({ endTime: e.target.value })}
                      className="pl-9 h-9 text-sm"
                      required
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {formData.startTime && formData.endTime && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded border border-blue-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Duration:{" "}
                    {(() => {
                      const start = new Date(`2000-01-01T${formData.startTime}`);
                      const end = new Date(`2000-01-01T${formData.endTime}`);
                      const diffMs = end.getTime() - start.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Personnel Assignment & Contact */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="collector" className="text-sm font-medium text-gray-700">
                  {formData.serviceType === "collection" ? "Assign Driver" : "Assign Maintenance"} *
                </Label>
                <div className="relative">
                  <select
                    id="collector"
                    value={formData.collectorId}
                    onChange={(e) => updateFormData({ collectorId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="contactPerson" className="text-sm font-medium text-gray-700">
                  Contact Person <span className="text-gray-400">(Optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="contactPerson"
                    placeholder="e.g., Mr. Lim (Facilities)"
                    value={formData.contactPerson}
                    onChange={(e) => updateFormData({ contactPerson: e.target.value })}
                    className="pl-9 h-9 text-sm"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Field */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes <span className="text-gray-400">(Optional)</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="notes"
                  placeholder="Additional instructions..."
                  value={formData.notes}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  rows={2}
                  className="pl-9 pt-2 text-sm"
                />
                <div className="absolute left-3 top-2">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
              </div>
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
              {loadingWorkers || loadingSchedules ? "Loading..." : "Add Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
