"use client";

import React from 'react';
import { Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface SpoilerShieldBannerProps {
  isLoggedIn: boolean;
  onMarkWatched?: () => void;
  onRevealSpoilers: () => void;
  isRevealed: boolean;
}

export function SpoilerShieldBanner({
  isLoggedIn,
  onMarkWatched,
  onRevealSpoilers,
  isRevealed,
}: SpoilerShieldBannerProps) {
  if (isRevealed) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-400" />
          <span>Spoiler protection is temporarily revealed for this view.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-black p-6 sm:p-8 text-center backdrop-blur-xl shadow-2xl">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
          Spoiler Shield Active
        </h3>

        <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
          You haven&apos;t marked this episode as watched yet. Discussions and reactions are shielded to keep your watching experience safe.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {isLoggedIn && onMarkWatched && (
            <button
              onClick={onMarkWatched}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Watched & Unlock
            </button>
          )}

          <button
            onClick={onRevealSpoilers}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-300 font-bold text-xs tracking-wider uppercase hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
            Reveal Spoilers
          </button>
        </div>
      </div>
    </div>
  );
}
