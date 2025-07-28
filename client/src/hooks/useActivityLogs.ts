import { useState, useEffect } from "react";
import api from "@/lib/api";

export interface ActivityLog {
  id: string;
  type?: string;
  time?: string;
  activity?: string;
  user?: string;
  priority?: string;
  [key: string]: any;
}

export function useActivityLogs(userId?: string) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    api.get(`/activity/${userId}`)
      .then(res => {
        setLogs(res.data.activities || []);
        setUser(res.data.user || null);
      })
      .catch(err => {
        setLogs([]);
        setUser(null);
        setError(err?.response?.data?.message || "Failed to fetch activity logs");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { logs, user, loading, error };
}
