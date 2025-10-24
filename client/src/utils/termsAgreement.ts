import { useState } from 'react';

// Utility functions for managing terms and conditions agreement
export const TERMS_AGREEMENT_KEY = 'ecobin-terms-agreed';

export const getTermsAgreement = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TERMS_AGREEMENT_KEY) === 'true';
};

export const setTermsAgreement = (agreed: boolean): void => {
  if (typeof window === 'undefined') return;
  
  if (agreed) {
    localStorage.setItem(TERMS_AGREEMENT_KEY, 'true');
  } else {
    localStorage.removeItem(TERMS_AGREEMENT_KEY);
  }
};

export const clearTermsAgreement = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TERMS_AGREEMENT_KEY);
};

// Hook for managing terms agreement state
export const useTermsAgreement = () => {
  const [agreed, setAgreed] = useState(getTermsAgreement());

  const updateAgreement = (newAgreement: boolean) => {
    setTermsAgreement(newAgreement);
    setAgreed(newAgreement);
  };

  const clearAgreement = () => {
    clearTermsAgreement();
    setAgreed(false);
  };

  return {
    agreed,
    updateAgreement,
    clearAgreement
  };
};
