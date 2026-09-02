"use client";

import React from 'react';
import { Star, MessageSquare, Trophy, Sparkles, User } from 'lucide-react';
import { EpisodeSummary } from '../types/discussion.types';

interface EpisodeCommunityRibbonProps {
  summary: EpisodeSummary | undefined;
  isWatched: boolean;
  onOpenRatingDrawer: () => void;
  onOpenDiscussionDrawer: () => void;
}

const EMOTION_CONFIG = [
  { key: 'mindblown' as const, emoji: '🔥', label: 'Mindblown' },
  { key: 'loved' as const, emoji: '😍', label: 'Loved it' },
  { key: 'funny' as const, emoji: '😂', label: 'Funny' },
  { key: 'epic' as const, emoji: '🍿', label: 'Epic' },
  { key: 'tense' as const, emoji: '🫣', label: 'Tense' },
  { key: 'shocked' as const, emoji: '😱', label: 'Shocked' },
  { key: 'emotional' as const, emoji: '😭', label: 'Emotional' },
  { key: 'confused' as const, emoji: '🤔', label: 'Confused' },
  { key: 'angry' as const, emoji: '😡', label: 'Angry' },
  { key: 'boring' as const, emoji: '🥱', label: 'Boring' },
];

export function EpisodeCommunityRibbon({
  summary,
  isWatched,
  onOpenRatingDrawer,
  onOpenDiscussionDrawer,
}: EpisodeCommunityRibbonProps) {
  const topMvp = summary?.mvpLeaderboard?.[0];
  const totalEmotions = summary?.emotionStats?.total || 0;
  const totalComments = summary?.totalComments ?? 0;
  const userRating = summary?.userReaction?.rating;
  const avgRating = summary?.ratingStats?.averageRating;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111116] via-[#0d0d10] to-[#121217] border border-zinc-800/90 p-4 sm:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {/* Ambient background light */}
        <div className="absolute top-0 right-1/3 w-64 h-24 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          {/* Left: Rating Block */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)] shrink-0">
                <Star className="w-5 h-5 fill-yellow-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {avgRating !== null && avgRating !== undefined ? avgRating.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold">/ 10</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase block">
                  {summary?.ratingStats?.totalRatings || 0} Ratings
                </span>
              </div>
            </div>

            {/* User Rating / Rate Button */}
            <button
              onClick={onOpenRatingDrawer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                userRating
                  ? 'bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/20 shadow-sm'
                  : 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${userRating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'}`} />
              <span>{userRating ? `Rated ${userRating}/10` : 'Rate Episode'}</span>
            </button>
          </div>

          {/* Center: Vibe & MVP Pill */}
          <div className="hidden lg:flex items-center gap-4 border-l border-zinc-800/80 pl-6">
            {/* Vibe Emoji Strip */}
            {totalEmotions > 0 && (
              <div className="flex items-center gap-2">
                {EMOTION_CONFIG.filter((e) => (summary?.emotionStats?.[e.key] || 0) > 0).slice(0, 3).map((e) => (
                  <span key={e.key} className="flex items-center gap-1 text-xs bg-zinc-900/80 border border-zinc-800 px-2 py-1 rounded-lg">
                    <span>{e.emoji}</span>
                    <span className="text-[11px] font-bold text-zinc-300">
                      {Math.round(((summary?.emotionStats?.[e.key] || 0) / totalEmotions) * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Standout MVP */}
            {topMvp && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                  {topMvp.profilePath ? (
                    <img src={`https://image.tmdb.org/t/p/w185${topMvp.profilePath}`} alt={topMvp.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
                <span className="text-xs font-bold text-amber-300 truncate max-w-[90px]">{topMvp.name}</span>
                <span className="text-[10px] font-black text-amber-400">{topMvp.percentage}%</span>
              </div>
            )}
          </div>

          {/* Right: Open Discussion Drawer Button */}
          <div className="w-full md:w-auto flex items-center justify-end">
            <button
              onClick={onOpenDiscussionDrawer}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm tracking-wide hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>Discussion & Comments ({totalComments})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
