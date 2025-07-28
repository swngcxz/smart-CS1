import { useApiGet, useApiPost } from "./useApi";

export function useStaffList() {
  return useApiGet("/api/staff");
}

export function useStaffDetail(staffId: string | null) {
  return useApiGet(staffId ? `/api/staff/${staffId}` : null);
}

export function useCreateStaff(staffData: any, trigger: boolean) {
  return useApiPost("/api/staff", staffData, trigger);
}
