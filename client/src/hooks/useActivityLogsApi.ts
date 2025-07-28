import { useApiGet } from "./useApi";

export function useAllActivityLogs() {
  return useApiGet("/api/activitylogs");
}
