import { useApiGet, useApiPost, useApiPut, useApiDelete } from "./useApi";

export function useTruckSchedulesList() {
  const result = useApiGet("/api/truck-schedules");
  
  // Debug logging
  console.log("useTruckSchedulesList result:", {
    data: result.data,
    loading: result.loading,
    error: result.error,
    dataLength: result.data?.length || 0
  });
  
  return result;
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

export function useDeleteTruckSchedule(truckScheduleId: string | null, trigger: boolean) {
  return useApiDelete(truckScheduleId ? `/api/truck-schedules/${truckScheduleId}` : null, trigger);
}
