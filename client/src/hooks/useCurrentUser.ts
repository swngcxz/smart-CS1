import { useEffect, useState } from "react";
import api from "@/lib/api";

export type CurrentUser = {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
  status?: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  fcmToken?: string;
  createdAt?: string;
  updatedAt?: string;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get<CurrentUser>("/auth/me");
        if (!isMounted) return;
        setUser(res.data);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.response?.data?.error || "Failed to load user");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading, error };
}


