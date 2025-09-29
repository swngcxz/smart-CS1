import { useState, useEffect } from 'react';

interface RatingModalState {
  isOpen: boolean;
  hasShown: boolean;
  lastShown: number;
}

const RATING_MODAL_KEY = 'rating-modal-state';
const SHOW_DELAY = 5000; // Show after 5 seconds
const MIN_INTERVAL = 7 * 24 * 60 * 60 * 1000; // Don't show again for 7 days

export const useRatingModal = () => {
  const [modalState, setModalState] = useState<RatingModalState>({
    isOpen: false,
    hasShown: false,
    lastShown: 0,
  });

  useEffect(() => {
    // Check if we should show the rating modal
    const checkShouldShow = () => {
      const savedState = localStorage.getItem(RATING_MODAL_KEY);
      
      if (savedState) {
        const { hasShown, lastShown } = JSON.parse(savedState);
        const now = Date.now();
        
        // Don't show if we've already shown it and it's been less than MIN_INTERVAL
        if (hasShown && (now - lastShown) < MIN_INTERVAL) {
          return;
        }
      }

      // Show the modal after a delay
      const timer = setTimeout(() => {
        setModalState(prev => ({ ...prev, isOpen: true }));
      }, SHOW_DELAY);

      return () => clearTimeout(timer);
    };

    const timer = checkShouldShow();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleRate = async (rating: number) => {
    // Save that user has rated
    const newState = {
      hasShown: true,
      lastShown: Date.now(),
      rating,
    };
    
    localStorage.setItem(RATING_MODAL_KEY, JSON.stringify(newState));
    
    // Send rating to backend
    try {
      const api = await import('@/lib/api');
      await api.default.post('/api/ratings', {
        rating,
        userAgent: navigator.userAgent,
        ipAddress: '', // Will be captured by backend
      });
      console.log('Rating submitted successfully:', rating);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const handleNotYet = () => {
    // Save that we showed it but user didn't rate
    const newState = {
      hasShown: true,
      lastShown: Date.now(),
      rating: null,
    };
    
    localStorage.setItem(RATING_MODAL_KEY, JSON.stringify(newState));
  };

  return {
    isOpen: modalState.isOpen,
    closeModal,
    handleRate,
    handleNotYet,
  };
};
