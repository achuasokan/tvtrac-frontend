"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Check } from 'lucide-react';
import { StarRatingPicker } from './StarRatingPicker';
import { EpisodeVibeSelector } from './EpisodeVibeSelector';
import { EpisodeCharacterPicker } from './EpisodeCharacterPicker';
import { CastMember, EmotionType } from '../types/discussion.types';
import { useSubmitReaction } from '../api/useSubmitReaction';

interface PostWatchReactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  cast: CastMember[];
  initialReaction?: {
    emotion?: EmotionType | null;
    characterId?: number | null;
    rating?: number | null;
  } | null;
}

export function PostWatchReactionDrawer({
  isOpen,
  onClose,
  tmdbId,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  cast,
  initialReaction,
}: PostWatchReactionDrawerProps) {
  const [rating, setRating] = useState<number | null>(initialReaction?.rating || null);
  const [emotion, setEmotion] = useState<EmotionType | null>(initialReaction?.emotion || null);
  const [characterId, setCharacterId] = useState<number | null>(initialReaction?.characterId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const { mutateAsync: submitReaction } = useSubmitReaction();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (rating !== null || emotion !== null || characterId !== null) {
        await submitReaction({
          tmdbId,
          season: seasonNumber,
          episode: episodeNumber,
          rating,
          emotion,
          characterId,
        });
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to submit post-watch reaction:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Curved Bottom Sheet (Fully Responsive across all mobile & desktop breakpoints) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-full sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c0c0e]/95 border-t border-x border-zinc-800/80 rounded-t-[28px] sm:rounded-t-[36px] p-4 sm:p-6 md:p-7 shadow-[0_-15px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-white flex flex-col gap-5 sm:gap-6 no-scrollbar [&::-webkit-scrollbar]:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle Bar */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-700/80 mx-auto shrink-0 mb-1" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <Sparkles className="w-3 h-3" />
                    Episode Watched
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                  S{String(seasonNumber).padStart(2, '0')}E{String(episodeNumber).padStart(2, '0')}
                  {episodeTitle ? ` · ${episodeTitle}` : ''}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  How was it? Rate and vote your favorite character.
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Rate the Episode (Clean open layout without clunky heavy box) */}
            <div className="flex flex-col items-center gap-2 py-1 w-full max-w-full overflow-visible">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 text-center">
                Rate This Episode
              </span>
              <StarRatingPicker value={rating} onChange={(r) => setRating(r)} size="md" />
            </div>

            {/* Section 2: Vibe Reaction */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 px-1">
                Episode Vibe
              </span>
              <EpisodeVibeSelector selectedEmotion={emotion} onSelect={(e) => setEmotion(emotion === e ? null : e)} />
            </div>

            {/* Section 3: Favorite Character (MVP) */}
            {cast && cast.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 px-1 flex items-center justify-between">
                  <span>MVP Character</span>
                  {characterId && (
                    <button
                      onClick={() => setCharacterId(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </span>
                <EpisodeCharacterPicker
                  cast={cast}
                  selectedCharacterId={characterId}
                  onSelect={(id) => setCharacterId(id)}
                />
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-black font-bold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Saved!</span>
                  </>
                ) : isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Reaction</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
