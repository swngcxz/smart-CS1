import { useApiGet, useApiPost } from "./useApi";

export function useSchedulesList() {
  const result = useApiGet("/api/schedules");
  
  // Debug logging
  console.log("🔍 useSchedulesList result:", {
    data: result.data,
    loading: result.loading,
    error: result.error,
    dataLength: result.data?.length || 0
  });
  
  return result;
}

export function useScheduleDetail(scheduleId: string | null) {
  return useApiGet(scheduleId ? `/api/schedules/${scheduleId}` : null);
}

export function useCreateSchedule(scheduleData: any, trigger: boolean) {
  return useApiPost("/api/schedules", scheduleData, trigger);
}
