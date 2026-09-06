"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Check, MessageSquare, ShieldAlert, Image as ImageIcon, Loader2, Film, Star } from 'lucide-react';
import { StarRatingPicker } from './StarRatingPicker';
import { EpisodePlatformSelector } from './EpisodePlatformSelector';
import { EpisodeCharacterPicker } from './EpisodeCharacterPicker';
import { CastMember, PendingMediaAttachment } from '../types/discussion.types';
import { useSubmitMovieReaction } from '../api/useSubmitMovieReaction';
import { useCreateMovieComment } from '../api/useCreateMovieComment';
import { useMovieSummary } from '../api/useMovieSummary';
import { discussionService } from '../api/discussion.service';
import { GifPickerModal } from './GifPickerModal';

interface PostWatchMovieReactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: string;
  movieTitle?: string;
  releaseYear?: string | number;
  cast: CastMember[];
  watchProviders?: any[];
  initialReaction?: {
    characterId?: number | null;
    rating?: number | null;
    platform?: string | null;
  } | null;
}

const QUICK_PROMPTS = [
  '🔥 Masterpiece',
  '🍿 Peak cinema',
  '👏 Incredible acting',
  '🎬 Visual spectacle',
  '❤️ Loved every minute',
  '🤔 Overrated',
];

function GifIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7.5 10H6.5A1.5 1.5 0 0 0 5 11.5v1A1.5 1.5 0 0 0 6.5 14h1v-2H6.5" />
      <path d="M12 10v4" />
      <path d="M16 10h2.5" />
      <path d="M16 12h1.5" />
      <path d="M16 10v4" />
    </svg>
  );
}

export function PostWatchMovieReactionDrawer({
  isOpen,
  onClose,
  tmdbId,
  movieTitle,
  releaseYear,
  cast,
  watchProviders = [],
  initialReaction,
}: PostWatchMovieReactionDrawerProps) {
  const [rating, setRating] = useState<number | null>(initialReaction?.rating || null);
  const [characterId, setCharacterId] = useState<number | null>(initialReaction?.characterId || null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(initialReaction?.platform || null);
  const [commentText, setCommentText] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaAttachment | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: summary } = useMovieSummary(tmdbId);
  const { mutateAsync: submitReaction } = useSubmitMovieReaction();
  const { mutateAsync: createComment } = useCreateMovieComment();

  // Sync existing reactions when drawer opens
  useEffect(() => {
    if (isOpen) {
      const existing = initialReaction || summary?.userReaction;
      if (existing) {
        if (existing.rating !== undefined && rating === null) setRating(existing.rating ?? null);
        if (existing.characterId !== undefined && characterId === null) setCharacterId(existing.characterId ?? null);
        if (existing.platform !== undefined && selectedPlatform === null) setSelectedPlatform(existing.platform ?? null);
      }
    }
  }, [isOpen, initialReaction, summary?.userReaction]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be 10MB or less.");
      return;
    }

    try {
      setIsUploadingMedia(true);
      const media = await discussionService.uploadMedia(file);
      setPendingMedia(media);
    } catch (err: any) {
      console.error("Upload failed:", err);
      alert(err.response?.data?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectGif = async (gif: { providerId: string; previewUrl: string }) => {
    try {
      setIsUploadingMedia(true);
      const media = await discussionService.attachGif(gif.providerId);
      setPendingMedia(media);
    } catch (err: any) {
      console.error("GIF attach failed:", err);
      alert(err.response?.data?.message || "Failed to attach GIF. Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);

      // 1. Submit reactions (rating, platform, cast MVP)
      if (rating !== null || characterId !== null || selectedPlatform !== null) {
        await submitReaction({
          tmdbId,
          rating,
          characterId,
          platform: selectedPlatform,
        });
      }

      // 2. Submit optional review comment
      const hasText = commentText.trim().length > 0;
      const hasMedia = Boolean(pendingMedia);

      if (hasText || hasMedia) {
        await createComment({
          tmdbId,
          content: hasText ? commentText.trim() : undefined,
          isSpoiler,
          mediaId: pendingMedia?.mediaId,
        });
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setCommentText('');
        setIsSpoiler(false);
        setPendingMedia(null);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error("Failed to save post-movie reaction:", err);
      alert(err.response?.data?.message || "Failed to save reaction. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasCommentOrMedia = commentText.trim().length > 0 || pendingMedia !== null;

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

          {/* Curved Bottom Sheet (Matching episode drawer design and structure) */}
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
                  <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#2dd4bf] bg-[#2dd4bf]/10 px-2.5 py-0.5 rounded-full border border-[#2dd4bf]/20">
                    <Film className="w-3 h-3" />
                    Movie Watched
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-extrabold text-white tracking-tight truncate">
                  {movieTitle || 'Movie Watched'}
                  {releaseYear ? ` (${releaseYear})` : ''}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  How was it? Rate, react, and share your hot take.
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Rate the Movie (Clean open layout matching episode drawer) */}
            <div className="flex flex-col items-center gap-2.5 py-1 w-full max-w-full overflow-visible">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 text-center">
                Rate This Movie
              </span>
              <StarRatingPicker value={rating} onChange={(r) => setRating(r)} size="md" />
            </div>

            {/* Section 2: Where Did You Watch It? (Streaming Platform) */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  <span>Where Did You Watch It?</span>
                </span>
                {selectedPlatform && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </span>
              <EpisodePlatformSelector
                isMovie={true}
                watchProviders={watchProviders}
                selectedPlatform={selectedPlatform}
                onSelect={(p) => setSelectedPlatform(p)}
              />
            </div>

            {/* Section 3: MVP Character (Matching EpisodeCharacterPicker) */}
            {cast && cast.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 px-1 flex items-center justify-between">
                  <span>MVP Character</span>
                  {characterId && (
                    <button
                      onClick={() => setCharacterId(null)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
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

            {/* Section 4: Quick Hot Take / Instant Discussion Comment */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  <span>Quick Hot Take</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  Optional • Posts to discussion
                </span>
              </div>

              {/* Quick Suggestion Prompt Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setCommentText((prev) => (prev ? `${prev} ${prompt}` : prompt));
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 transition-all shrink-0 active:scale-95 select-none cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Hidden File Input for Photo Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Input Box with Integrated Toolbar */}
              <div className="relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-2.5 flex flex-col gap-2 focus-within:border-[#2dd4bf]/60 focus-within:ring-1 focus-within:ring-[#2dd4bf]/40 transition-all">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Drop a thought, review, or scene reaction..."
                  maxLength={2000}
                  rows={2}
                  className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none scrollbar-none"
                />

                {/* Media Preview if attached */}
                {pendingMedia && (
                  <div className="relative inline-block w-24 h-24 rounded-xl overflow-hidden border border-zinc-700 group my-1">
                    <img
                      src={pendingMedia.previewUrl}
                      alt="Attachment preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingMedia(null)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-black text-white transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Attach Photo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingMedia || pendingMedia !== null}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Attach Image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    {/* Attach GIF */}
                    <button
                      type="button"
                      onClick={() => {
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                        setIsGifModalOpen(true);
                      }}
                      disabled={isUploadingMedia || pendingMedia !== null}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Attach GIF"
                    >
                      <GifIcon className="w-4 h-4" />
                    </button>

                    {isUploadingMedia && (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin text-[#2dd4bf]" />
                        <span>Uploading...</span>
                      </span>
                    )}
                  </div>

                  {/* Spoiler Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsSpoiler(!isSpoiler)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                      isSpoiler
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Spoiler</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons (Matching episode drawer footer) */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isUploadingMedia}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || isUploadingMedia}
                className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#2dd4bf] hover:bg-[#20b8a4] text-black font-bold text-xs tracking-wider uppercase transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(45,212,191,0.3)] cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : isSaving ? (
                  <span>Saving...</span>
                ) : hasCommentOrMedia ? (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Save & Post</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Reaction</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Integrated GIF Picker Modal */}
          <GifPickerModal
            isOpen={isGifModalOpen}
            onClose={() => setIsGifModalOpen(false)}
            onSelectGif={handleSelectGif}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
