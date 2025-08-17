import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface Staff {
  id: string;
  fullName: string;
  email: string;
  role: string;
  location?: string;
  status?: string;
  lastActivity?: string;
}

export function useJanitors() {
  const [janitors, setJanitors] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJanitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/staff/janitors");
      setJanitors(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to fetch janitors");
      setJanitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJanitors();
  }, []);

  return { janitors, loading, error, refetch: fetchJanitors };
}

export function useActivityLogging() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logActivity = async (activityData: {
    user_id: string;
    bin_id: string;
    bin_location: string;
    bin_status: string;
    bin_level: number;
    assigned_janitor_id?: string;
    assigned_janitor_name?: string;
    task_note?: string;
    activity_type?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/activitylogs", activityData);
      return response.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || "Failed to log activity";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { logActivity, loading, error };
}
