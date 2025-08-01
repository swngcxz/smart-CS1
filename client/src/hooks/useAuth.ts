import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Login handler
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      toast({ title: "Login Successful", description: "Welcome back!" });
      // Redirect based on role (assume role is in token or response)
      const { token } = res.data;
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role === "admin") {
        navigate("/admin");
      } else if (payload.role === "staff") {
        navigate("/staff");
      } else {
        navigate("/users");
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err?.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const signup = async (fullName: string, email: string, password: string, address?: string, role?: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/signup", { fullName, email, password, address, role });
      toast({ title: "Signup Successful", description: "Welcome!" });
      // Redirect to login or dashboard after signup
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Signup Failed",
        description: err?.response?.data?.error || "Signup error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Signout handler
  const signout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/signout");
      toast({ title: "Signed out", description: "You have been signed out." });
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Signout Failed",
        description: err?.response?.data?.error || "Signout error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { login, signup, signout, loading };
}
  