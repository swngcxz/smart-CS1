import { useState, useEffect } from 'react';
import { useAccount } from './useAccount';

export function useAuthState() {
  const { account, loading, error } = useAccount();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsAuthenticated(!!account);
      setIsInitialized(true);
      console.log('🔐 Mobile App - Auth state updated:', {
        isAuthenticated: !!account,
        hasAccount: !!account,
        loading,
        error
      });
    }
  }, [account, loading, error]);

  return {
    isAuthenticated,
    isInitialized,
    account,
    loading,
    error
  };
}
