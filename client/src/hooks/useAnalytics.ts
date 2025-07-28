import { useApiGet } from "./useApi";

export function useAnalytics() {
  return useApiGet("/api/analytics");
}
