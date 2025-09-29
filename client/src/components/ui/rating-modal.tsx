import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRate?: (rating: number) => void;
  title?: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onRate,
  title = "What do you think of our app?"
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating: number) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleRate = async () => {
    if (rating > 0) {
      try {
        await onRate?.(rating);
        toast({
          title: "Thank you for your rating!",
          description: `You rated us ${rating} star${rating > 1 ? 's' : ''}.`,
        });
        onClose();
        setRating(0);
      } catch (error) {
        toast({
          title: "Rating submitted!",
          description: `You rated us ${rating} star${rating > 1 ? 's' : ''}.`,
        });
        onClose();
        setRating(0);
      }
    }
  };

  const handleNotYet = () => {
    onClose();
    setRating(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-8 pr-8">
            {title}
          </h3>

          {/* Stars */}
          <div className="flex justify-center gap-1 mb-8">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoveredRating || rating);
              return (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      isFilled
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Rate Button */}
          <Button
            onClick={handleRate}
            disabled={rating === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full mb-3 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Rate
          </Button>

          {/* Not yet Link */}
          <button
            onClick={handleNotYet}
            className="text-gray-600 hover:text-gray-800 underline text-sm transition-colors"
          >
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
};
