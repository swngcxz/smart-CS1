import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Login failed');
      return null;
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Always set role to 'janitor' for mobile app signups
      const res = await axiosInstance.post('/auth/signup', { fullName, email, password, role: 'janitor' });
      setLoading(false);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Signup failed');
      return null;
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post('/auth/signout');
      setLoading(false);
      return true;
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Logout failed');
      return false;
    }
  };

  return { login, signup, logout, loading, error };
}
