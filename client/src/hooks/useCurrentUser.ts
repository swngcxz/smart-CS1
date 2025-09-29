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
  bio?: string;
  website?: string;
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

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await api.get<CurrentUser>("/auth/me");
      setUser(res.data);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await fetchUser();
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading, error, refreshUser: fetchUser };
}


