"use client";

import React from 'react';
import { Star } from 'lucide-react';

interface EpisodeRatingSummaryProps {
  averageRating: number | null;
  totalRatings: number;
  userRating?: number | null;
  onOpenRatingModal?: () => void;
}

export function EpisodeRatingSummary({
  averageRating,
  totalRatings,
  userRating,
  onOpenRatingModal,
}: EpisodeRatingSummaryProps) {
  return (
    <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
          <Star className="w-5 h-5 fill-yellow-400" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white">
              {averageRating !== null ? averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-xs text-zinc-500">/ 10</span>
          </div>
          <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-semibold">
            {totalRatings} {totalRatings === 1 ? 'Rating' : 'Ratings'}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-zinc-800" />

      {/* User Rating pill */}
      <div className="flex-1 flex items-center justify-end">
        {userRating ? (
          <button
            onClick={onOpenRatingModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold hover:bg-yellow-400/20 transition-colors"
          >
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>Your rating: {userRating}/10</span>
          </button>
        ) : onOpenRatingModal ? (
          <button
            onClick={onOpenRatingModal}
            className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            + Rate Episode
          </button>
        ) : null}
      </div>
    </div>
  );
}
