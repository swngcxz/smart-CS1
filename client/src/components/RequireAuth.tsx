import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type RequireAuthProps = {
  children: ReactNode;
  allowedRoles?: string[];
};

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete

    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to continue.", 
        variant: "destructive" 
      });
      navigate("/", { replace: true });
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to access this page.", 
        variant: "destructive" 
      });
      navigate("/", { replace: true });
      return;
    }
  }, [user, loading, isAuthenticated, allowedRoles, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div
            className="h-10 w-10 rounded-full border-4 border-gray-300 border-t-primary animate-spin mx-auto mb-4"
            aria-label="Loading"
          />
          <p className="text-sm text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}


