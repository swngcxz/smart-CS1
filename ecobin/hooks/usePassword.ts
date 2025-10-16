import { useState, useCallback } from 'react';
import apiClient from '../utils/apiConfig';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface UsePasswordReturn {
  loading: boolean;
  error: string | null;
  changePassword: (data: ChangePasswordData) => Promise<ChangePasswordResponse>;
  clearError: () => void;
}

// Custom hook for password management
export function usePassword(): UsePasswordReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(async (data: ChangePasswordData): Promise<ChangePasswordResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Silent password change attempt

      const response = await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data?.message) {
        return {
          success: true,
          message: response.data.message,
        };
      } else {
        throw new Error('Failed to change password');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid password format';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Don't log to console to avoid mobile console errors
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    changePassword,
    clearError,
  };
}

export default usePassword;
