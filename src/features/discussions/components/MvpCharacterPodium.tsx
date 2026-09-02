"use client";

import React from 'react';
import { MvpCharacter } from '../types/discussion.types';
import { Crown, Trophy, User } from 'lucide-react';

interface MvpCharacterPodiumProps {
  mvpList: MvpCharacter[];
}

const PODIUM_RANKS = [
  { rank: 1, label: '1st', medal: '🥇', border: 'border-amber-400/80', bg: 'from-amber-500/20 to-zinc-900', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]' },
  { rank: 2, label: '2nd', medal: '🥈', border: 'border-zinc-300/60', bg: 'from-zinc-400/20 to-zinc-900', glow: 'shadow-[0_0_15px_rgba(212,212,216,0.2)]' },
  { rank: 3, label: '3rd', medal: '🥉', border: 'border-amber-700/60', bg: 'from-amber-800/20 to-zinc-900', glow: 'shadow-[0_0_15px_rgba(180,83,9,0.2)]' },
];

export function MvpCharacterPodium({ mvpList }: MvpCharacterPodiumProps) {
  if (!mvpList || mvpList.length === 0) {
    return (
      <div className="text-xs text-zinc-500 py-2 text-center">
        No character MVP votes yet. Be the first to vote!
      </div>
    );
  }

  const top3 = mvpList.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-zinc-400">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span>Episode MVPs</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((char, index) => {
          const rankInfo = PODIUM_RANKS[index] || PODIUM_RANKS[2];
          return (
            <div
              key={char.characterId}
              className={`relative flex items-center gap-3 p-3 rounded-2xl border bg-gradient-to-b ${rankInfo.bg} ${rankInfo.border} ${rankInfo.glow} backdrop-blur-md`}
            >
              {/* Rank Medal Badge */}
              <div className="absolute -top-2 -left-2 text-sm bg-black/80 rounded-full px-1.5 py-0.5 border border-white/10 shadow">
                {rankInfo.medal}
              </div>

              {/* Character Avatar */}
              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/20">
                {char.profilePath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w185${char.profilePath}`}
                    alt={char.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-white truncate">
                    {char.name}
                  </h4>
                  <span className="text-[11px] font-black text-amber-400 shrink-0">
                    {char.percentage}%
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate">
                  {char.actorName}
                </p>
                <span className="text-[9px] text-zinc-500">
                  {char.voteCount} {char.voteCount === 1 ? 'vote' : 'votes'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
