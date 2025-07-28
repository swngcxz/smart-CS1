import { useApiGet, useApiPost } from "./useApi";

export function useWasteList() {
  return useApiGet("/api/waste");
}

export function useWasteDetail(wasteId: string | null) {
  return useApiGet(wasteId ? `/api/waste/${wasteId}` : null);
}

export function useCreateWaste(wasteData: any, trigger: boolean) {
  return useApiPost("/api/waste", wasteData, trigger);
}
