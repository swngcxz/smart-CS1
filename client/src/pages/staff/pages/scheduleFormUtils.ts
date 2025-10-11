import { format } from "date-fns";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Collector, Schedule } from "./scheduleTypes";

export interface ScheduleFormData {
  serviceType: "collection" | "maintenance";
  location: string;
  type: string;
  startTime: string;
  endTime: string;
  date: Date | undefined;
  capacity: string;
  collectorId: string;
  truckPlate: string;
  notes: string;
  contactPerson: string;
  priority: "Low" | "Normal" | "High";
}

export interface ScheduleFormState {
  drivers: Collector[];
  maintenanceWorkers: Collector[];
  loadingWorkers: boolean;
  existingSchedules: any[];
  existingTruckSchedules: any[];
  loadingSchedules: boolean;
  validationError: string;
}

export const useScheduleFormState = () => {
  const { toast } = useToast();

  const fetchWorkers = async (
    setDrivers: (drivers: Collector[]) => void,
    setMaintenanceWorkers: (workers: Collector[]) => void,
    setLoadingWorkers: (loading: boolean) => void
  ) => {
    setLoadingWorkers(true);
    try {
      const [driversResponse, maintenanceResponse] = await Promise.all([
        api.get("/api/staff/drivers"),
        api.get("/api/staff/maintenance"),
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

  const fetchExistingSchedules = async (
    setExistingSchedules: (schedules: any[]) => void,
    setExistingTruckSchedules: (schedules: any[]) => void,
    setLoadingSchedules: (loading: boolean) => void
  ) => {
    setLoadingSchedules(true);
    try {
      const [schedulesResponse, truckSchedulesResponse] = await Promise.all([
        api.get("/api/schedules"),
        api.get("/api/truck-schedules"),
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

  const checkForPastDate = (date: Date | undefined, setValidationError: (error: string) => void): boolean => {
    if (!date) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      setValidationError("Cannot create schedule for past dates. Please select today or a future date.");
      return true;
    }

    return false;
  };

  const checkForDuplicateSchedule = (
    formData: ScheduleFormData,
    existingSchedules: any[],
    existingTruckSchedules: any[],
    setValidationError: (error: string) => void
  ): boolean => {
    if (!formData.location || !formData.date || !formData.startTime || !formData.endTime) {
      return false;
    }

    const formattedDate = format(formData.date, "yyyy-MM-dd");
    const trimmedLocation = formData.location.trim().toLowerCase();

    if (formData.serviceType === "collection") {
      const duplicate = existingTruckSchedules.find((schedule) => {
        const scheduleDate = schedule.date || schedule.start_date;
        const scheduleLocation = (schedule.location || "").toLowerCase();

        if (scheduleLocation === trimmedLocation && scheduleDate === formattedDate) {
          const scheduleStart = schedule.start_collected || schedule.start_time;
          const scheduleEnd = schedule.end_collected || schedule.end_time;

          if (scheduleStart && scheduleEnd) {
            return (
              (formData.startTime >= scheduleStart && formData.startTime < scheduleEnd) ||
              (formData.endTime > scheduleStart && formData.endTime <= scheduleEnd) ||
              (formData.startTime <= scheduleStart && formData.endTime >= scheduleEnd)
            );
          }
          return true;
        }
        return false;
      });

      if (duplicate) {
        const existingStart = duplicate.start_collected || duplicate.start_time;
        const existingEnd = duplicate.end_collected || duplicate.end_time;
        setValidationError(
          `A collection schedule already exists for "${formData.location.trim()}" on ${format(
            formData.date,
            "PPP"
          )} from ${existingStart} to ${existingEnd}. Please choose a different time or location.`
        );
        return true;
      }
    } else {
      const duplicate = existingSchedules.find((schedule) => {
        const scheduleDate = schedule.date || schedule.start_date;
        const scheduleLocation = (schedule.location || "").toLowerCase();

        if (scheduleLocation === trimmedLocation && scheduleDate === formattedDate) {
          const scheduleStart = schedule.start_time;
          const scheduleEnd = schedule.end_time;

          if (scheduleStart && scheduleEnd) {
            return (
              (formData.startTime >= scheduleStart && formData.startTime < scheduleEnd) ||
              (formData.endTime > scheduleStart && formData.endTime <= scheduleEnd) ||
              (formData.startTime <= scheduleStart && formData.endTime >= scheduleEnd)
            );
          }
          return true;
        }
        return false;
      });

      if (duplicate) {
        const existingStart = duplicate.start_time;
        const existingEnd = duplicate.end_time;
        setValidationError(
          `A maintenance schedule already exists for "${formData.location.trim()}" on ${format(
            formData.date,
            "PPP"
          )} from ${existingStart} to ${existingEnd}. Please choose a different time or location.`
        );
        return true;
      }
    }

    return false;
  };

  const submitSchedule = async (
    formData: ScheduleFormData,
    selectedCollector: Collector | undefined,
    isEditing: boolean = false,
    editingSchedule?: Schedule | null,
    onSuccess?: (schedule: Schedule) => void
  ) => {
    try {
      let response;

      if (formData.serviceType === "collection") {
        const scheduleData = {
          staffId: formData.collectorId,
          sched_type: "collection",
          start_collected: formData.startTime,
          end_collected: formData.endTime,
          location: formData.location.trim(),
          status: editingSchedule?.status || "scheduled",
          date: format(formData.date!, "yyyy-MM-dd"),
          priority: formData.priority,
          ...(formData.notes.trim() && { notes: formData.notes.trim() }),
          ...(formData.contactPerson.trim() && { contactPerson: formData.contactPerson.trim() }),
          ...(formData.truckPlate.trim() && { truckPlate: formData.truckPlate.trim().toUpperCase() }),
        };

        if (isEditing) {
          response = await api.put(`/api/truck-schedules/${editingSchedule!.id}`, scheduleData);
        } else {
          response = await api.post("/api/truck-schedules", scheduleData);
        }
      } else {
        const scheduleData = {
          staffId: formData.collectorId,
          sched_type: "maintenance",
          start_time: formData.startTime,
          end_time: formData.endTime,
          location: formData.location.trim(),
          status: editingSchedule?.status || "scheduled",
          date: format(formData.date!, "yyyy-MM-dd"),
          priority: formData.priority,
          lunch_break_start: "12:00",
          lunch_break_end: "13:00",
          ...(formData.notes.trim() && { notes: formData.notes.trim() }),
          ...(formData.contactPerson.trim() && { contactPerson: formData.contactPerson.trim() }),
        };

        if (isEditing) {
          response = await api.put(`/api/schedules/${editingSchedule!.id}`, scheduleData);
        } else {
          response = await api.post("/api/schedules", scheduleData);
        }
      }

      if (response.status === 200 || response.status === 201) {
        const scheduleData: Schedule = {
          ...editingSchedule,
          id: editingSchedule?.id || response.data?.id,
          serviceType: formData.serviceType,
          location: formData.location.trim(),
          type: formData.serviceType,
          time: `${formData.startTime} - ${formData.endTime}`,
          date: format(formData.date!, "yyyy-MM-dd"),
          status: editingSchedule?.status || "scheduled",
          collector: selectedCollector,
          notes: formData.notes.trim() || undefined,
          contactPerson: formData.contactPerson.trim() || undefined,
          start_collected: formData.startTime,
          end_collected: formData.endTime,
          priority: formData.priority,
          ...(formData.truckPlate.trim() && { truckPlate: formData.truckPlate.trim().toUpperCase() }),
        };

        if (onSuccess) {
          onSuccess(scheduleData);
        }

        toast({
          variant: "success",
          title: "Success",
          description: `${formData.serviceType === "collection" ? "Trash collection" : "Maintenance"} schedule ${
            isEditing ? "updated" : "created"
          } successfully!`,
        });

        return true;
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? "updating" : "creating"} schedule:`, error);

      const errorMessage =
        error.response?.data?.error || error.message || `Failed to ${isEditing ? "update" : "create"} schedule`;

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });

      return false;
    }
  };

  return {
    fetchWorkers,
    fetchExistingSchedules,
    checkForPastDate,
    checkForDuplicateSchedule,
    submitSchedule,
  };
};
