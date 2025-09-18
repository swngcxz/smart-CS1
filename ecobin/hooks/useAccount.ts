import { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export interface AccountData {
  id?: string;
  fullName: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
}

export function useAccount() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      try {
        console.log('👤 Mobile App - Fetching account info...');
        // This assumes you have a /auth/me endpoint that returns the current user's info
        const res = await axiosInstance.get('/auth/me');
        console.log('👤 Mobile App - Account response:', res.data);
        setAccount(res.data);
        setError(null);
      } catch (err: any) {
        console.error('👤 Mobile App - Failed to fetch account:', err);
        setError(err.response?.data?.error || 'Failed to fetch account');
        setAccount(null); // Clear account on error
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, []);

  return { account, loading, error };
}
