import { useApiGet, useApiPost, useApiPut } from "./useApi";

export function useTruckSchedulesList() {
  return useApiGet("/api/truck-schedules");
}

export function useTruckScheduleDetail(truckScheduleId: string | null) {
  return useApiGet(truckScheduleId ? `/api/truck-schedules/${truckScheduleId}` : null);
}

export function useCreateTruckSchedule(truckScheduleData: any, trigger: boolean) {
  return useApiPost("/api/truck-schedules", truckScheduleData, trigger);
}

export function useUpdateTruckScheduleStatus(truckScheduleId: string | null, status: string, trigger: boolean) {
  return useApiPut(truckScheduleId ? `/api/truck-schedules/${truckScheduleId}` : null, { status }, trigger);
}
