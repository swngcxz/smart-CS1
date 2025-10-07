import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Validation functions
const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
};

// Error handling helper
const getErrorMessage = (error: any): string => {
  if (error.response?.status === 401) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (error.response?.status === 400) {
    return error.response?.data?.error || 'Invalid request. Please check your input.';
  }
  if (error.response?.status === 404) {
    return 'User not found. Please check your email address.';
  }
  if (error.response?.status === 429) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please check your internet connection and try again.';
  }
  return error.response?.data?.error || error.message || 'Login failed. Please try again.';
};

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Input validation
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setLoading(false);
      setValidationErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      return null;
    }

    try {
      console.log('🔐 Auth - Attempting login request to:', axiosInstance.defaults.baseURL + '/auth/login');
      const res = await axiosInstance.post('/auth/login', { email, password });
      
      // Store token in AsyncStorage for persistence
      if (res.data.token) {
        await AsyncStorage.setItem('auth_token', res.data.token);
        console.log('🔐 Auth - Token stored successfully');
      }
      
      setLoading(false);
      setError(null);
      setValidationErrors({});
      
      // Log successful login for debugging
      console.log('🔐 Auth - Login successful:', {
        email,
        hasToken: !!res.data?.token,
        hasUser: !!res.data?.user,
        message: res.data?.message,
        response: res.data
      });
      
      return res.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setValidationErrors({});
      
      // Log error for debugging but don't show popup
      console.log('🔐 Auth - Login failed:', {
        email,
        error: errorMessage,
        status: err.response?.status,
        response: err.response?.data,
        message: err.message,
        code: err.code,
        baseURL: axiosInstance.defaults.baseURL,
        fullError: err
      });
      
      return null;
    }
  };

  const signup = async (fullName: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Input validation
    const fullNameError = !fullName || fullName.trim() === '' ? 'Full name is required' : null;
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (fullNameError || emailError || passwordError) {
      setLoading(false);
      setValidationErrors({
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      return null;
    }

    try {
      // Always set role to 'janitor' for mobile app signups
      const res = await axiosInstance.post('/auth/signup', { fullName, email, password, role: 'janitor' });
      setLoading(false);
      setError(null);
      setValidationErrors({});
      return res.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setValidationErrors({});
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

  return { 
    login, 
    signup, 
    logout, 
    loading, 
    error, 
    validationErrors,
    clearError: () => setError(null),
    clearValidationErrors: () => setValidationErrors({})
  };
}
