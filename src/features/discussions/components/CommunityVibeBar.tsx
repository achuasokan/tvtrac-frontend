"use client";

import React from 'react';
import { EpisodeSummary } from '../types/discussion.types';

interface CommunityVibeBarProps {
  stats: EpisodeSummary['emotionStats'];
}

const EMOTION_CONFIG = [
  { key: 'mindblown' as const, emoji: '🔥', label: 'Mindblown', bg: 'bg-orange-500' },
  { key: 'loved' as const, emoji: '😍', label: 'Loved it', bg: 'bg-rose-500' },
  { key: 'funny' as const, emoji: '😂', label: 'Funny', bg: 'bg-amber-400' },
  { key: 'epic' as const, emoji: '🍿', label: 'Epic', bg: 'bg-yellow-500' },
  { key: 'tense' as const, emoji: '🫣', label: 'Tense', bg: 'bg-emerald-500' },
  { key: 'shocked' as const, emoji: '😱', label: 'Shocked', bg: 'bg-purple-500' },
  { key: 'emotional' as const, emoji: '😭', label: 'Emotional', bg: 'bg-blue-500' },
  { key: 'confused' as const, emoji: '🤔', label: 'Confused', bg: 'bg-violet-500' },
  { key: 'angry' as const, emoji: '😡', label: 'Angry', bg: 'bg-red-500' },
  { key: 'boring' as const, emoji: '🥱', label: 'Boring', bg: 'bg-zinc-600' },
];

export function CommunityVibeBar({ stats }: CommunityVibeBarProps) {
  const total = stats.total || 0;

  if (total === 0) {
    return (
      <div className="text-xs text-zinc-500 py-1">
        Be the first to leave an emotion vibe!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Progress Bar Segment */}
      <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
        {EMOTION_CONFIG.map(({ key, bg }) => {
          const count = stats[key] || 0;
          if (count === 0) return null;
          const percentage = (count / total) * 100;
          return (
            <div
              key={key}
              style={{ width: `${percentage}%` }}
              className={`${bg} h-full transition-all duration-500`}
              title={`${percentage.toFixed(0)}% ${key}`}
            />
          );
        })}
      </div>

      {/* Emoji Chips with Percentages */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2 pt-1">
        {EMOTION_CONFIG.map(({ key, emoji, label }) => {
          const count = stats[key] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-1">
              <span>{emoji}</span>
              <span className="font-semibold text-zinc-300">{percentage}%</span>
              <span className="text-zinc-500 hidden sm:inline">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
