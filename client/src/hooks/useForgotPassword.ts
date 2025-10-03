import { useState } from 'react';
import api from '@/lib/api';

interface ForgotPasswordState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useForgotPassword = () => {
  const [state, setState] = useState<ForgotPasswordState>({
    loading: false,
    error: null,
    success: false,
  });

  const requestPasswordReset = async (email: string) => {
    setState({ loading: true, error: null, success: false });

    try {
      const response = await api.post('/auth/request-password-reset', { email });
      
      setState({ loading: false, error: null, success: true });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email. Please try again.';
      setState({ loading: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    setState({ loading: true, error: null, success: false });

    try {
      const response = await api.post('/auth/reset-password', { 
        email,
        otp, 
        newPassword 
      });
      
      setState({ loading: false, error: null, success: true });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password. Please try again.';
      setState({ loading: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setState({ loading: true, error: null, success: false });

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      
      setState({ loading: false, error: null, success: true });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to verify OTP. Please try again.';
      setState({ loading: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  const resendOtp = async (email: string) => {
    setState({ loading: true, error: null, success: false });

    try {
      const response = await api.post('/auth/resend-otp', { email });
      
      setState({ loading: false, error: null, success: true });
      return { success: true, message: response.data.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to resend OTP. Please try again.';
      setState({ loading: false, error: errorMessage, success: false });
      return { success: false, error: errorMessage };
    }
  };

  const clearState = () => {
    setState({ loading: false, error: null, success: false });
  };

  return {
    ...state,
    requestPasswordReset,
    verifyOtp,
    resetPassword,
    resendOtp,
    clearState,
  };
};
