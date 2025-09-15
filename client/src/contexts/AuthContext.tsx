import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export type User = {
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

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string, address?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      setLoading(true);
      console.log('Checking authentication...');
      
      // First check if we have a token in localStorage
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        console.log('No token found in localStorage');
        setUser(null);
        return;
      }
      
      if (storedUser) {
        console.log('Found user in localStorage:', JSON.parse(storedUser));
        setUser(JSON.parse(storedUser));
      }
      
      // Verify token with backend
      const response = await api.get<User>('/auth/me');
      console.log('Auth check successful:', response.data);
      setUser(response.data);
      
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(response.data));
      
    } catch (error: any) {
      console.log('Auth check failed:', error?.response?.status, error?.response?.data);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Store token and user data
      if (response.data.token && response.data.user) {
        console.log('Storing token and user data in localStorage');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        console.log('Token stored:', response.data.token);
        console.log('User stored:', response.data.user);
      } else {
        console.error('No token or user data in response:', response.data);
      }
      
      toast({ 
        title: "Login Successful", 
        description: "Welcome back!" 
      });

      // Navigate based on backend response
      if (response.data.redirectTo) {
        console.log('Navigating to:', response.data.redirectTo);
        navigate(response.data.redirectTo, { replace: true });
      } else {
        // Fallback navigation
        console.log('Fallback navigation to /staff');
        navigate('/staff', { replace: true });
      }
      
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      toast({
        title: "Login Failed",
        description: error?.response?.data?.error || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, password: string, address?: string, role?: string) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/signup', { 
        fullName, 
        email, 
        password, 
        address, 
        role 
      });
      
      toast({ 
        title: "Signup Successful", 
        description: "Please log in with your new account." 
      });

      // Navigate to login page after successful signup
      if (response.data.redirectTo) {
        navigate(response.data.redirectTo, { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error?.response?.data?.error || "Signup failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/auth/signout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast({ 
        title: "Signed out", 
        description: "You have been signed out successfully." 
      });
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear client state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Initial auth check on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    checkAuth,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
