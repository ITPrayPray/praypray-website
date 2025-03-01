'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 20,
  interactive = false,
  onChange,
}) => {
  const totalStars = 5;
  
  // Handle star click when interactive
  const handleStarClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex items-center">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const filled = starValue <= rating;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            className={`${interactive ? 'cursor-pointer focus:outline-none' : 'cursor-default'} p-0.5`}
            disabled={!interactive}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={`${
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
};