import { useApiGet, useApiPost } from "./useApi";

export function useSchedulesList() {
  return useApiGet("/api/schedules");
}

export function useScheduleDetail(scheduleId: string | null) {
  return useApiGet(scheduleId ? `/api/schedules/${scheduleId}` : null);
}

export function useCreateSchedule(scheduleData: any, trigger: boolean) {
  return useApiPost("/api/schedules", scheduleData, trigger);
}
