import { useState } from "react";
import api from "@/lib/api";

export interface TaskAssignment {
  staff_id: string;
  bin_id: string;
  bin_location: string;
  task_type: string;
  priority: "low" | "medium" | "high" | "critical";
  notes?: string;
  assigned_by?: string;
  assigned_at?: string;
}

export function useTaskAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignTask = async (taskData: TaskAssignment) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post("/api/task-assignments", taskData);
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || "Failed to assign task";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    assignTask,
    loading,
    error,
    clearError
  };
}
