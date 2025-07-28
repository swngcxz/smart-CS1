import { useApiGet } from "./useApi";

export function useBinData() {
  return useApiGet("/api/bin");
}
