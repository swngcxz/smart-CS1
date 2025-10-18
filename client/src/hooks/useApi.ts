import api from "@/lib/api";
import { useState, useEffect } from "react";

// Generic fetch hook
export function useApiGet<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    api.get(url)
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.error || "Failed to fetch data"))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Generic POST hook
export function useApiPost<T = any>(url: string | null, data: any, trigger: boolean) {
  const [response, setResponse] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !trigger) return;
    setLoading(true);
    setError(null);
    api.post(url, data)
      .then(res => setResponse(res.data))
      .catch(err => setError(err?.response?.data?.error || "Failed to post data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [url, data, trigger]);

  return { response, loading, error };
}

// Generic PUT hook
export function useApiPut<T = any>(url: string | null, body: any, trigger: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !trigger) return;
    setLoading(true);
    setError(null);
    api.put(url, body)
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.error || "Failed to update data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [url, trigger]);

  return { data, loading, error };
}

// Generic DELETE hook
export function useApiDelete<T = any>(url: string | null, trigger: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url || !trigger) return;
    setLoading(true);
    setError(null);
    api.delete(url)
      .then(res => setData(res.data))
      .catch(err => setError(err?.response?.data?.error || "Failed to delete data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [url, trigger]);

  return { data, loading, error };
}

// Example usage for each controller:
// useApiGet("/api/staff")
// useApiGet("/api/schedules")
// useApiGet("/api/truck-schedules")
// useApiGet("/api/analytics")
// useApiGet("/api/waste")
// useApiGet("/api/bin")
// useApiGet("/api/activitylogs")
