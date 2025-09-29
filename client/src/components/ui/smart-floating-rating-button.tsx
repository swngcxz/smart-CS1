import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { RatingModal } from './rating-modal';
import { useRatingSubmission } from '@/hooks/useRatingSubmission';

// Check if user is logged in by checking for auth token
const useAuthStatus = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for authentication token in cookies or localStorage
    const checkAuthStatus = () => {
      // Check for token in document.cookie
      const hasToken = document.cookie.includes('token=') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('authToken');
      setIsLoggedIn(!!hasToken);
    };

    checkAuthStatus();

    // Listen for storage changes (in case user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case cookies are updated
    const interval = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return isLoggedIn;
};

interface SmartFloatingRatingButtonProps {
  className?: string;
  showAfterDelay?: number; // milliseconds
  hideOnPages?: string[]; // pages to hide the button
  showOnlyAfterActions?: boolean; // only show after user interactions
}

export const SmartFloatingRatingButton: React.FC<SmartFloatingRatingButtonProps> = ({ 
  className = "",
  showAfterDelay = 10000, // 10 seconds
  hideOnPages = [],
  showOnlyAfterActions = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const { handleRate } = useRatingSubmission();
  const isLoggedIn = useAuthStatus(); // Check if user is logged in

  // Hide button immediately when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      setShouldShow(false);
    }
  }, [isLoggedIn]);

  // Check if current page should hide the button
  const shouldHideOnCurrentPage = () => {
    const currentPath = window.location.pathname;
    return hideOnPages.some(page => currentPath.includes(page));
  };

  // Show button after delay (only if user is not logged in)
  useEffect(() => {
    // Don't show if user is logged in
    if (isLoggedIn) return;
    
    if (shouldHideOnCurrentPage()) return;

    const timer = setTimeout(() => {
      if (showOnlyAfterActions && !userInteracted) {
        // Wait for user interaction
        return;
      }
      setShouldShow(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [showAfterDelay, showOnlyAfterActions, userInteracted, isLoggedIn]);

  // Track user interactions (only if user is not logged in)
  useEffect(() => {
    if (!showOnlyAfterActions || isLoggedIn) return;

    const handleUserInteraction = () => {
      setUserInteracted(true);
    };

    // Listen for various user interactions
    const events = ['click', 'scroll', 'keydown', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [showOnlyAfterActions, isLoggedIn]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Don't render if user is logged in or other conditions aren't met
  if (isLoggedIn || !shouldShow || shouldHideOnCurrentPage()) {
    return null;
  }

  return (
    <>
      {/* Floating Rating Button */}
      <button
        onClick={openModal}
        className={`
          fixed bottom-6 right-6 
          w-14 h-14 
          bg-green-600 hover:bg-green-700 
          rounded-full 
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200 
          hover:scale-105 active:scale-95
          z-40
          ${className}
        `}
        title="Rate our app"
        aria-label="Open rating modal"
      >
        <Star className="w-6 h-6 text-white fill-current" />
      </button>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onRate={handleRate}
        title="What do you think of our app?"
      />
    </>
  );
};
