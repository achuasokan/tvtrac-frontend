"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingPickerProps {
  value: number | null | undefined;
  onChange: (rating: number) => void;
  disabled?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRatingPicker({
  value,
  onChange,
  disabled = false,
  showText = true,
  size = 'sm',
}: StarRatingPickerProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayRating = hoverValue ?? value ?? 0;

  const starSizeClasses = {
    sm: 'w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
  }[size];

  return (
    <div className="flex items-center gap-1.5 overflow-visible select-none">
      {/* 10 Stars row */}
      <div className="flex items-center gap-0.5 sm:gap-1 overflow-visible">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
          const isFilled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHoverValue(star)}
              onMouseLeave={() => !disabled && setHoverValue(null)}
              className="p-0.5 text-zinc-600 hover:scale-125 active:scale-95 transition-transform duration-150 focus:outline-none disabled:cursor-not-allowed shrink-0"
              aria-label={`Rate ${star} out of 10`}
            >
              <Star
                className={`${starSizeClasses} transition-colors duration-200 ${
                  isFilled
                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                    : 'text-zinc-700 hover:text-zinc-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Optional Rating Label */}
      {showText && (
        <div className="text-xs font-bold tracking-wide text-center shrink-0">
          {displayRating > 0 ? (
            <span className="text-yellow-400">{displayRating}/10</span>
          ) : (
            <span className="text-zinc-500 text-[11px]">Rate</span>
          )}
        </div>
      )}
    </div>
  );
}
