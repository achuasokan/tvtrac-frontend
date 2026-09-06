"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { StarRatingPicker } from './StarRatingPicker';

interface TvTimeRatingCardProps {
  averageRating: number | null;
  totalRatings: number;
  userRating?: number | null;
  onRate: (rating: number) => void;
  isSubmitting?: boolean;
}

export function TvTimeRatingCard({
  averageRating,
  totalRatings,
  userRating,
  onRate,
  isSubmitting = false,
}: TvTimeRatingCardProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 py-2.5 border-b border-zinc-800/60 w-full select-none">
      {/* 1. Community Average Rating Display */}
      <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-yellow-400 shrink-0">
            <Star className="w-4 h-4 fill-yellow-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white tracking-tight whitespace-nowrap">
              {averageRating !== null && averageRating !== undefined ? averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-zinc-500 font-semibold whitespace-nowrap">/ 10</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium whitespace-nowrap">
          <span className="hidden md:inline text-zinc-600">•</span>
          <span>{totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}</span>
        </div>
      </div>

      {/* 2. Interactive Star Rating Bar */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 w-full md:w-auto pr-1 sm:pr-0">
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
          {userRating ? 'Your Rating:' : 'Rate:'}
        </span>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <StarRatingPicker
            value={userRating || null}
            onChange={(r) => onRate(r)}
            disabled={isSubmitting}
            showText={false}
            size="sm"
          />
          {userRating ? (
            <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/15 border border-yellow-500/35 text-yellow-400 text-[10.5px] sm:text-xs font-black shrink-0 leading-none">
              {userRating}/10
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500 font-medium shrink-0">
              (Tap to rate)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
