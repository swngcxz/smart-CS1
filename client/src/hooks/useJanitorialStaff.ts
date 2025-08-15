import { useApiGet } from "./useApi";

export interface JanitorialStaff {
  id: string;
  fullName: string;
  role: string;
  email: string;
  location?: string;
  status?: string;
  phone?: string;
}

export function useJanitorialStaff() {
  return useApiGet<JanitorialStaff[]>("/api/staff");
}

export function useJanitorialStaffByLocation(location: string | null) {
  const { data: allStaff, loading, error } = useJanitorialStaff();
  
  if (!location || !allStaff) {
    return { data: [], loading, error };
  }

  // Filter staff by location if they have location data
  // For now, we'll return all staff since the backend might not have location filtering
  const filteredStaff = allStaff.filter(staff => 
    !staff.location || staff.location === location || staff.location === "All Routes"
  );

  return { data: filteredStaff, loading, error };
}
