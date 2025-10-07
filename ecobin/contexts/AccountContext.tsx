import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axiosInstance from '../utils/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AccountData {
  id?: string;
  fullName: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
  contactNumber?: string; // Fallback field name
}

interface AccountContextType {
  account: AccountData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setAccount: (account: AccountData | null) => void;
  updateAccountFromLogin: (loginData: any) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

interface AccountProviderProps {
  children: ReactNode;
}

// Helper function to get stored token
const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    return token;
  } catch (error) {
    console.log('Error getting stored token:', error);
    return null;
  }
};

export function AccountProvider({ children }: AccountProviderProps) {
  const [account, setAccountState] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchAccount = async () => {
    try {
      console.log('👤 Mobile App - Fetching account info...');
      const res = await axiosInstance.get('/auth/me');
      console.log('👤 Mobile App - Account response:', res.data);
      setAccountState(res.data);
      setError(null);
    } catch (err: any) {
      console.error('👤 Mobile App - Failed to fetch account:', err);
      // Don't set error for 401 - user just isn't logged in
      if (err.response?.status === 401) {
        console.log('👤 Mobile App - User not authenticated, setting account to null');
        setAccountState(null);
        setError(null);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch account');
        setAccountState(null);
      }
    } finally {
      setLoading(false);
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }
  };

  const refetch = async () => {
    await fetchAccount();
  };

  const setAccount = (newAccount: AccountData | null) => {
    setAccountState(newAccount);
  };

  const updateAccountFromLogin = (loginData: any) => {
    // Update account state immediately from login response
    if (loginData?.user) {
      console.log('👤 Mobile App - Updating account from login:', loginData.user);
      setAccountState(loginData.user);
      setLoading(false);
      setError(null);
      setIsInitialized(true);
    }
  };

  // Only fetch account data if we have a token (user is logged in)
  useEffect(() => {
    // Check if we have a token in cookies or storage
    const checkAuthAndFetch = async () => {
      try {
        // Try to get token from cookies or AsyncStorage
        const token = await getStoredToken();
        if (token) {
          console.log('👤 Mobile App - Token found, fetching account...');
          await fetchAccount();
        } else {
          console.log('👤 Mobile App - No token found, skipping account fetch');
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.log('👤 Mobile App - Error checking auth, skipping account fetch');
        setLoading(false);
        setIsInitialized(true);
      }
    };
    
    checkAuthAndFetch();
  }, []); // Empty dependency array - only run once

  const value = {
    account,
    loading,
    error,
    refetch,
    setAccount,
    updateAccountFromLogin,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
