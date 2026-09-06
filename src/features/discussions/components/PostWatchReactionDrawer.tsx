"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Check, MessageSquare, ShieldAlert, Image as ImageIcon, Loader2, Tv } from 'lucide-react';
import { StarRatingPicker } from './StarRatingPicker';
import { EpisodeVibeSelector } from './EpisodeVibeSelector';
import { EpisodeCharacterPicker } from './EpisodeCharacterPicker';
import { EpisodePlatformSelector } from './EpisodePlatformSelector';
import { CastMember, EmotionType, PendingMediaAttachment } from '../types/discussion.types';
import { useSubmitReaction } from '../api/useSubmitReaction';
import { useCreateComment } from '../api/useCreateComment';
import { useEpisodeSummary } from '../api/useEpisodeSummary';
import { discussionService } from '../api/discussion.service';
import { GifPickerModal } from './GifPickerModal';

interface PostWatchReactionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  cast: CastMember[];
  watchProviders?: any[];
  networks?: any[];
  initialReaction?: {
    emotion?: EmotionType | null;
    characterId?: number | null;
    rating?: number | null;
    platform?: string | null;
  } | null;
}

const QUICK_PROMPTS = [
  '🤯 Insane ending!',
  '😱 Didn\'t expect that twist',
  '🔥 Peak cinema',
  '❤️ Loved every minute',
  '😭 My heart hurts',
  '🤔 So many questions...',
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

export function PostWatchReactionDrawer({
  isOpen,
  onClose,
  tmdbId,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  cast,
  watchProviders = [],
  networks = [],
  initialReaction,
}: PostWatchReactionDrawerProps) {
  const [rating, setRating] = useState<number | null>(initialReaction?.rating || null);
  const [emotion, setEmotion] = useState<EmotionType | null>(initialReaction?.emotion || null);
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

  const { data: summary } = useEpisodeSummary(tmdbId, seasonNumber, episodeNumber);
  const { mutateAsync: submitReaction } = useSubmitReaction();
  const { mutateAsync: createComment } = useCreateComment();

  // Sync existing user reactions when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      const existing = initialReaction || summary?.userReaction;
      if (existing) {
        if (existing.rating !== undefined && rating === null) setRating(existing.rating ?? null);
        if (existing.emotion !== undefined && emotion === null) setEmotion(existing.emotion ?? null);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (rating !== null || emotion !== null || characterId !== null || selectedPlatform !== null) {
        await submitReaction({
          tmdbId,
          season: seasonNumber,
          episode: episodeNumber,
          rating,
          emotion,
          characterId,
          platform: selectedPlatform,
        });
      }

      const hasComment = commentText.trim().length > 0;
      const hasMedia = pendingMedia !== null;

      if (hasComment || hasMedia) {
        await createComment({
          tmdbId,
          season: seasonNumber,
          episode: episodeNumber,
          content: commentText.trim(),
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
    } catch (err) {
      console.error('Failed to submit post-watch reaction:', err);
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
                  How was it? Rate, react, and share your hot take.
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
            <div className="flex flex-col items-center gap-2.5 py-1 w-full max-w-full overflow-visible">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 text-center">
                Rate This Episode
              </span>
              <StarRatingPicker value={rating} onChange={(r) => setRating(r)} size="md" />
            </div>

            {/* Section 2: Where Did You Watch It? (Streaming Platform) */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  <span>Where Did You Watch It?</span>
                </span>
                {selectedPlatform && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </span>
              <EpisodePlatformSelector
                watchProviders={watchProviders}
                networks={networks}
                selectedPlatform={selectedPlatform}
                onSelect={(p) => setSelectedPlatform(p)}
              />
            </div>

            {/* Section 3: Vibe Reaction */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 px-1">
                Episode Vibe
              </span>
              <EpisodeVibeSelector selectedEmotion={emotion} onSelect={(e) => setEmotion(emotion === e ? null : e)} />
            </div>

            {/* Section 4: Favorite Character (MVP) */}
            {cast && cast.length > 0 && (
              <div className="flex flex-col gap-2.5">
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

            {/* Section 5: Quick Hot Take / Instant Discussion Comment */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
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
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700 transition-all shrink-0 active:scale-95 select-none"
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

              {/* Comment Textarea Card */}
              <div className="flex flex-col gap-2 p-2.5 sm:p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700/50 transition-all duration-200">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={2}
                  maxLength={500}
                  disabled={isSaving || isUploadingMedia}
                  className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none leading-relaxed min-h-[50px] py-0.5"
                />

                {/* Attached Media Preview (Photo / GIF) */}
                {(pendingMedia || isUploadingMedia) && (
                  <div className="relative inline-flex items-center gap-2 sm:gap-2.5 p-1.5 pr-2.5 sm:pr-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 shadow-inner max-w-full sm:max-w-fit animate-in fade-in zoom-in-95 duration-150 my-1">
                    {isUploadingMedia ? (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-amber-400 font-medium">
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-amber-400" />
                        <span>Processing media...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-zinc-800">
                          <img src={pendingMedia!.previewUrl} alt="Attached media" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate">
                            {pendingMedia!.type === 'gif' ? 'GIF Attached' : 'Photo Attached'}
                          </span>
                          <span className="text-[9px] text-zinc-400">Ready to post</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingMedia(null)}
                          className="p-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors ml-auto sm:ml-1 shrink-0"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Textarea Bottom Toolbar: Photo, GIF, Spoiler Chip & Counter */}
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/50 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Attach Photo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingMedia || isSaving || pendingMedia !== null}
                      className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 bg-zinc-900/80 border border-zinc-800/80 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
                      title="Upload photo (max 10MB)"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Photo</span>
                    </button>

                    {/* Attach GIF */}
                    <button
                      type="button"
                      onClick={() => setIsGifModalOpen(true)}
                      disabled={isUploadingMedia || isSaving || pendingMedia !== null}
                      className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 bg-zinc-900/80 border border-zinc-800/80 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
                      title="Search & attach GIF"
                    >
                      <GifIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>GIF</span>
                    </button>

                    {/* Spoiler Toggle Chip */}
                    <button
                      type="button"
                      onClick={() => setIsSpoiler(!isSpoiler)}
                      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all select-none border active:scale-95 shrink-0 ${
                        isSpoiler
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      <span>Spoiler</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-zinc-500 ml-auto">
                    {commentText.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving || isUploadingMedia}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isUploadingMedia}
                className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-black font-bold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
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

