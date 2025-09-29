import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { RatingModal } from './rating-modal';
import { useRatingSubmission } from '@/hooks/useRatingSubmission';

/**
 * FloatingRatingButton - A simple floating action button for rating
 * 
 * Features:
 * - Green circular button with star icon (matches design from image)
 * - Fixed position in bottom-right corner
 * - Hover effects and animations
 * - Opens rating modal when clicked
 * - Integrates with rating submission API
 * 
 * @param className - Additional CSS classes for styling
 */
interface FloatingRatingButtonProps {
  className?: string;
}

export const FloatingRatingButton: React.FC<FloatingRatingButtonProps> = ({ 
  className = "" 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleRate } = useRatingSubmission();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

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
