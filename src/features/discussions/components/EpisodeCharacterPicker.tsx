"use client";

import React from 'react';
import { CastMember } from '../types/discussion.types';
import { Crown, User } from 'lucide-react';

interface EpisodeCharacterPickerProps {
  cast: CastMember[];
  selectedCharacterId: number | null | undefined;
  onSelect: (characterId: number | null) => void;
  disabled?: boolean;
}

export function EpisodeCharacterPicker({
  cast,
  selectedCharacterId,
  onSelect,
  disabled = false,
}: EpisodeCharacterPickerProps) {
  if (!cast || cast.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-zinc-500">
        No character cast data available for this episode.
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 no-scrollbar hide-scrollbar [&::-webkit-scrollbar]:hidden snap-x">
      {cast.map((member) => {
        const isSelected = selectedCharacterId === member.id;
        return (
          <button
            key={member.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(isSelected ? null : member.id)}
            className={`group relative shrink-0 w-24 sm:w-28 flex flex-col items-center p-2 rounded-2xl border transition-all duration-200 snap-start text-center focus:outline-none ${
              isSelected
                ? 'bg-gradient-to-b from-[#2dd4bf]/20 via-zinc-900 to-zinc-950 border-[#2dd4bf]/60 shadow-[0_0_20px_rgba(45,212,191,0.25)] ring-1 ring-[#2dd4bf]/40 scale-105'
                : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/60'
            }`}
          >
            {isSelected && (
              <div className="absolute -top-2 -right-1 bg-[#2dd4bf] text-black p-1 rounded-full shadow-lg">
                <Crown className="w-3.5 h-3.5 fill-black" />
              </div>
            )}

            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-zinc-800 mb-2 border border-white/10 group-hover:scale-105 transition-transform">
              {member.profilePath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${member.profilePath}`}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
              {member.name}
            </span>
            <span className="text-[9px] sm:text-[10px] text-zinc-500 line-clamp-1">
              {member.actorName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
