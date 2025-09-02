import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type RequireAuthProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
};

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get<CurrentUser>("/auth/me");
        if (!isMounted) return;
        setUser(res.data);
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(res.data.role)) {
          toast({ title: "Access denied", description: "Insufficient permissions.", variant: "destructive" });
          navigate("/", { replace: true });
          return;
        }
      } catch (err: any) {
        if (!isMounted) return;
        toast({ title: "Login first", description: "Please log in to continue.", variant: "destructive" });
        navigate("/", { replace: true });
        return;
      } finally {
        if (isMounted) setChecking(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [allowedRoles, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div
          className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-primary animate-spin"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <>{children}</>;
}


