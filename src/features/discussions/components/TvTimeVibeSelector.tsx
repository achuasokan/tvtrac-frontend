"use client";

import React from 'react';
import { EmotionType } from '../types/discussion.types';

interface TvTimeVibeSelectorProps {
  selectedEmotion?: EmotionType | null;
  emotionStats?: {
    mindblown: number;
    loved: number;
    funny?: number;
    epic?: number;
    tense?: number;
    shocked: number;
    emotional: number;
    confused?: number;
    angry?: number;
    boring: number;
    total: number;
  };
  onSelectEmotion: (emotion: EmotionType) => void;
  isSubmitting?: boolean;
}

const VIBES = [
  {
    key: 'mindblown' as EmotionType,
    emoji: '🔥',
    label: 'Mindblown',
    activeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.2)]',
    barColor: 'bg-gradient-to-r from-orange-500 to-amber-400',
  },
  {
    key: 'loved' as EmotionType,
    emoji: '😍',
    label: 'Loved It',
    activeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    barColor: 'bg-gradient-to-r from-rose-500 to-pink-400',
  },
  {
    key: 'funny' as EmotionType,
    emoji: '😂',
    label: 'Funny',
    activeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    barColor: 'bg-gradient-to-r from-amber-400 to-yellow-300',
  },
  {
    key: 'epic' as EmotionType,
    emoji: '🍿',
    label: 'Epic',
    activeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.2)]',
    barColor: 'bg-gradient-to-r from-yellow-400 to-amber-500',
  },
  {
    key: 'tense' as EmotionType,
    emoji: '🫣',
    label: 'Tense',
    activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  {
    key: 'shocked' as EmotionType,
    emoji: '😱',
    label: 'Shocked',
    activeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
    barColor: 'bg-gradient-to-r from-purple-500 to-indigo-400',
  },
  {
    key: 'emotional' as EmotionType,
    emoji: '😭',
    label: 'Emotional',
    activeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)]',
    barColor: 'bg-gradient-to-r from-blue-500 to-cyan-400',
  },
  {
    key: 'confused' as EmotionType,
    emoji: '🤔',
    label: 'Confused',
    activeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.2)]',
    barColor: 'bg-gradient-to-r from-violet-500 to-fuchsia-400',
  },
  {
    key: 'angry' as EmotionType,
    emoji: '😡',
    label: 'Angry',
    activeColor: 'text-red-400 bg-red-500/10 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    barColor: 'bg-gradient-to-r from-red-500 to-rose-400',
  },
  {
    key: 'boring' as EmotionType,
    emoji: '🥱',
    label: 'Boring',
    activeColor: 'text-zinc-300 bg-zinc-800/40 border-zinc-600/50 shadow-[0_0_12px_rgba(113,113,122,0.15)]',
    barColor: 'bg-zinc-600',
  },
];

export function TvTimeVibeSelector({
  selectedEmotion,
  emotionStats,
  onSelectEmotion,
  isSubmitting = false,
}: TvTimeVibeSelectorProps) {
  const totalVotes = emotionStats?.total || 0;
  const hasUserVoted = Boolean(selectedEmotion);

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
          How was this episode?
        </h3>

        {hasUserVoted && totalVotes > 0 && (
          <span className="text-[10px] font-semibold text-zinc-500">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        )}
      </div>

      {/* Responsive Grid: 5 columns on mobile (2 rows of 5), 10 columns on desktop */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2 w-full">
        {VIBES.map((vibe) => {
          const isSelected = selectedEmotion === vibe.key;
          const voteCount = (emotionStats as any)?.[vibe.key] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

          return (
            <button
              key={vibe.key}
              type="button"
              onClick={() => onSelectEmotion(vibe.key)}
              disabled={isSubmitting}
              className={`group relative flex flex-col items-center justify-between min-h-[64px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-xl border transition-all duration-200 active:scale-95 ${
                isSelected
                  ? vibe.activeColor
                  : 'bg-white/[0.02] hover:bg-white/[0.05] border-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              {/* Cute Compact Emoji & Label */}
              <div className="flex flex-col items-center gap-1 w-full">
                <span className="text-lg sm:text-2xl transition-transform duration-200 group-hover:scale-115">
                  {vibe.emoji}
                </span>

                <span
                  className={`text-[8.5px] sm:text-[10px] font-bold leading-tight text-center truncate max-w-full ${
                    isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {vibe.label}
                </span>
              </div>

              {/* Percentage Bar & Tag — revealed only after voting */}
              {hasUserVoted && totalVotes > 0 && (
                <div className="w-full flex flex-col items-center gap-0.5 mt-1 animate-in fade-in duration-300">
                  {percentage > 0 ? (
                    <>
                      <div className="w-full h-1 bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${vibe.barColor}`}
                        />
                      </div>
                      <span
                        className={`text-[8px] sm:text-[9px] font-extrabold ${
                          isSelected ? 'text-white' : 'text-zinc-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </>
                  ) : (
                    <span className="text-[8px] sm:text-[9px] text-zinc-600">
                      0%
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
