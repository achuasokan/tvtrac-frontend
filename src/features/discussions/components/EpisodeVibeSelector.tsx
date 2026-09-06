"use client";

import React from 'react';
import { EmotionType } from '../types/discussion.types';

interface EpisodeVibeSelectorProps {
  selectedEmotion: EmotionType | null | undefined;
  onSelect: (emotion: EmotionType) => void;
  disabled?: boolean;
}

const EMOTIONS: Array<{ id: EmotionType; label: string; emoji: string; color: string; border: string }> = [
  { id: 'mindblown', label: 'Mindblown', emoji: '🔥', color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/50' },
  { id: 'loved', label: 'Loved it', emoji: '😍', color: 'from-pink-500/20 to-rose-500/20', border: 'border-rose-500/50' },
  { id: 'funny', label: 'Funny', emoji: '😂', color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/50' },
  { id: 'epic', label: 'Epic', emoji: '🍿', color: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/50' },
  { id: 'tense', label: 'Tense', emoji: '🫣', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/50' },
  { id: 'shocked', label: 'Shocked', emoji: '😱', color: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/50' },
  { id: 'emotional', label: 'Emotional', emoji: '😭', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/50' },
  { id: 'confused', label: 'Confused', emoji: '🤔', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/50' },
  { id: 'angry', label: 'Angry', emoji: '😡', color: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/50' },
  { id: 'boring', label: 'Boring', emoji: '🥱', color: 'from-zinc-500/20 to-zinc-700/20', border: 'border-zinc-500/50' },
];

export function EpisodeVibeSelector({ selectedEmotion, onSelect, disabled = false }: EpisodeVibeSelectorProps) {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-5 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-1.5 sm:gap-2 w-full">
      {EMOTIONS.map((item) => {
        const isSelected = selectedEmotion === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.id)}
            className={`group relative flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-200 active:scale-95 ${
              isSelected
                ? `bg-gradient-to-r ${item.color} ${item.border} text-white scale-102 shadow-[0_0_12px_rgba(255,255,255,0.15)] ring-1 ring-white/20`
                : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <span className="text-base sm:text-lg transition-transform group-hover:scale-120">
              {item.emoji}
            </span>
            <span className="text-[11px] font-bold tracking-wide">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
