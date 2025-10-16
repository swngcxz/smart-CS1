import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import apiClient from '../utils/apiConfig';

// Types
export interface User {
  id: string;
  fullName: string;
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
  // Additional properties that might come from the server
  _id?: string;
  name?: string;
  contactNumber?: string;
  location?: string;
  lastActivity?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  redirectTo?: string;
  fallback?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  getSessionInfo: () => Promise<{
    loginTime: string;
    sessionDuration: number;
    isActive: boolean;
  } | null>;
}

// Custom hook for authentication
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('[useAuth] Checking auth status...');
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('[useAuth] Token found:', !!token);
      console.log('[useAuth] UserData found:', !!userData);
      
      if (token && userData) {
        console.log('[useAuth] Found stored auth data, parsing user data...');
        const parsedUserData = JSON.parse(userData);
        console.log('[useAuth] Parsed user data:', parsedUserData);
        
        // First, set the user from stored data
        setState({
          isAuthenticated: true,
          user: parsedUserData,
          loading: false,
          error: null,
        });
        
        // Then verify token with server in background
        try {
          console.log('[useAuth] Verifying token with server...');
          const response = await apiClient.get('/auth/me');
          
          if (response.data) {
            console.log('[useAuth] Server verification successful, updating user data');
            const user = response.data;
            setState({
              isAuthenticated: true,
              user,
              loading: false,
              error: null,
            });
            // Update stored user data with fresh server data
            await AsyncStorage.setItem('userData', JSON.stringify(user));
          } else {
            console.log('[useAuth] Server verification failed, keeping local data');
            // Keep the local data even if server verification fails
          }
        } catch (error: any) {
          console.log('[useAuth] Server verification error, keeping local data:', error.message);
          // Keep the local data even if server verification fails
        }
      } else {
        console.log('[useAuth] No stored auth data found');
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('[useAuth] Error checking auth status:', error);
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Failed to check authentication status',
      });
    }
  }, []);

  const clearAuthData = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('loginTimestamp');
    } catch (error) {
      // Silently handle auth data clearing error
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data && response.data.token) {
        const { token, user, redirectTo, message } = response.data;
        
        console.log('[useAuth] Login successful, storing auth data...');
        console.log('[useAuth] User data to store:', user);

        // Store auth data including session info for history tracking
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        // Store login timestamp for session tracking
        await AsyncStorage.setItem('loginTimestamp', new Date().toISOString());
        
        console.log('[useAuth] Auth data stored successfully');

        setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });

        // Handle role-based redirection
        if (redirectTo) {
          // Map server redirect paths to mobile app routes
          if (redirectTo === '/admin') {
            router.replace('/(tabs)/home' as any); // or create an admin route
          } else if (redirectTo === '/staff') {
            router.replace('/(tabs)/home' as any);
          } else {
            router.replace('/(tabs)/home' as any);
          }
        } else {
          // Default redirect to home
          router.replace('/(tabs)/home' as any);
        }

        return {
          success: true,
          message: message || 'Login successful',
          token,
          user,
          redirectTo,
        };
      } else {
        const errorMsg = response.data?.error || 'Login failed';
        setState(prev => ({ ...prev, loading: false, error: errorMsg }));
        
        return {
          success: false,
          message: errorMsg,
        };
      }
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 403) {
        errorMessage = 'Please verify your email before logging in';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState(prev => ({ ...prev, loading: false, error: errorMessage }));

      return {
        success: false,
        message: errorMessage,
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Get session duration for logging
      let sessionDuration = 0;
      try {
        const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
        if (loginTimestamp) {
          const loginTime = new Date(loginTimestamp);
          const logoutTime = new Date();
          sessionDuration = Math.round((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60)); // in minutes
          console.log('[LOGOUT] Session duration:', sessionDuration, 'minutes');
        }
      } catch (error) {
        console.log('[LOGOUT] Could not calculate session duration:', error);
      }

      // Call server logout endpoint to update history logs
      try {
        const response = await apiClient.post('/auth/signout');
        console.log('[LOGOUT] Server logout successful:', response.data);
      } catch (error: any) {
        console.log('[LOGOUT] Server logout failed, continuing with local logout:', error.message);
        // Server logout failed, but continuing with local logout
      }

      // Clear local storage
      await clearAuthData();

      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });

      // Redirect to login
      router.replace('/(auth)/login' as any);
    } catch (error) {
      console.error('[LOGOUT] Logout error:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Logout failed' }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get current session info
  const getSessionInfo = useCallback(async () => {
    try {
      const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
      if (loginTimestamp) {
        const loginTime = new Date(loginTimestamp);
        const currentTime = new Date();
        const sessionDuration = Math.round((currentTime.getTime() - loginTime.getTime()) / (1000 * 60)); // in minutes
        
        return {
          loginTime: loginTimestamp,
          sessionDuration,
          isActive: true
        };
      }
      return null;
    } catch (error) {
      console.error('[SESSION] Error getting session info:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    checkAuthStatus,
    clearError,
    getSessionInfo,
  };
}

// Hook for password reset
export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/request-password-reset', { email });

      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data?.error || 'Failed to request password reset');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to request password reset';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/verify-otp', { email, otp });

      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data?.error || 'Invalid OTP');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'OTP verification failed';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      });

      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message,
        };
      } else {
        throw new Error(response.data?.error || 'Failed to reset password');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to reset password';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    requestPasswordReset,
    verifyOtp,
    resetPassword,
    clearError: () => setError(null),
  };
}

export default useAuth;


