"use client";

import React, { useRef } from 'react';
import { Trophy, ChevronLeft, ChevronRight, User, Check, Crown } from 'lucide-react';
import { CastMember } from '../types/discussion.types';

interface TvTimeMvpCarouselProps {
  cast: CastMember[];
  selectedCharacterId?: number | null;
  mvpLeaderboard?: Array<{
    characterId: number;
    name: string;
    actorName: string;
    profilePath: string | null;
    voteCount: number;
    percentage: number;
  }>;
  onSelectCharacter: (characterId: number) => void;
  isSubmitting?: boolean;
  title?: string;
}

export function TvTimeMvpCarousel({
  cast,
  selectedCharacterId,
  mvpLeaderboard = [],
  onSelectCharacter,
  isSubmitting = false,
  title = 'Character of the Episode (MVP)',
}: TvTimeMvpCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUserVoted = Boolean(selectedCharacterId);
  const totalMvpVotes = mvpLeaderboard.reduce((acc, curr) => acc + curr.voteCount, 0);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const statsMap = new Map<number, { percentage: number; rank: number }>();
  mvpLeaderboard.forEach((item, index) => {
    statsMap.set(item.characterId, { percentage: item.percentage, rank: index + 1 });
  });

  if (!cast || cast.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 py-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#2dd4bf]" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            {title}
          </h3>
        </div>

        {/* Count & Scroll Buttons */}
        <div className="flex items-center gap-2">
          {hasUserVoted && totalMvpVotes > 0 && (
            <span className="text-[10px] font-semibold text-zinc-500 mr-1">
              {totalMvpVotes} {totalMvpVotes === 1 ? 'vote' : 'votes'}
            </span>
          )}

          {/* Scroll Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Seamless Open Cast Avatars Row (No bulky box containers) */}
      <div
        ref={scrollRef}
        className="flex gap-3 xs:gap-4 sm:gap-5 overflow-x-auto pb-2 no-scrollbar [&::-webkit-scrollbar]:hidden snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cast.map((member) => {
          const isSelected = selectedCharacterId === member.id;
          const stat = statsMap.get(member.id);
          const rank = stat?.rank;
          const percentage = stat?.percentage;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectCharacter(member.id)}
              disabled={isSubmitting}
              className="group shrink-0 w-16 xs:w-20 sm:w-24 flex flex-col items-center gap-1.5 sm:gap-2 transition-all duration-200 snap-start text-center active:scale-95"
            >
              {/* Circular Avatar */}
              <div className="relative">
                <div
                  className={`w-14 h-14 xs:w-16 xs:h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden transition-all duration-300 group-hover:scale-105 border-2 ${
                    isSelected
                      ? 'border-[#2dd4bf] shadow-[0_0_16px_rgba(45,212,191,0.4)] ring-2 ring-[#2dd4bf]/25'
                      : 'border-zinc-800/90 group-hover:border-zinc-600'
                  }`}
                >
                  {member.profilePath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${member.profilePath}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Selection Badge: ONLY shown when THIS user selected this character */}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#2dd4bf] text-black flex items-center justify-center shadow-md animate-in zoom-in duration-150">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Names & Percentage */}
              <div className="w-full flex flex-col items-center">
                <span
                  className={`text-xs line-clamp-1 transition-colors ${
                    isSelected ? 'font-black text-[#2dd4bf]' : 'font-bold text-zinc-200 group-hover:text-white'
                  }`}
                >
                  {member.name}
                </span>
                <span className="text-[10px] text-zinc-500 line-clamp-1">
                  {member.actorName}
                </span>

                {/* Percentage Badge — revealed only after voting */}
                {hasUserVoted && totalMvpVotes > 0 && (
                  percentage !== undefined && percentage > 0 ? (
                    <span
                      className={`mt-1 text-[10px] font-black px-2 py-0.5 rounded-full transition-colors animate-in fade-in duration-300 ${
                        isSelected
                          ? 'bg-[#2dd4bf] text-black shadow-sm'
                          : 'bg-zinc-800/90 text-zinc-300 border border-zinc-700/60'
                      }`}
                    >
                      {percentage}%
                    </span>
                  ) : (
                    <span className="mt-1 text-[10px] text-zinc-600">0%</span>
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
