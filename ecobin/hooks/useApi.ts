import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, API } from '../utils/apiServices';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean; // Whether to call the API immediately
  dependencies?: any[]; // Dependencies for useEffect
}

// Generic hook for API calls
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.message || response.error || 'An error occurred',
        });
      }
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'Network error occurred',
      });
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, ...(options.dependencies || [])]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useApiMutation<T, P = any>(
  apiCall: (params: P) => Promise<ApiResponse<T>>
): UseApiState<T> & {
  mutate: (params: P) => Promise<ApiResponse<T>>;
  reset: () => void;
} {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: P): Promise<ApiResponse<T>> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall(params);
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.message || response.error || 'An error occurred',
        });
      }
      
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Network error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// Hook for authentication
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      // Silently handle auth status check error
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await API.auth.login(email, password);
      
      if (response.success && response.data) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        setUser(response.data.user);
        setIsAuthenticated(true);
        
        return response;
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      await API.auth.logout();
    } catch (error) {
      // Silently handle logout error
    } finally {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuthStatus,
  };
}
