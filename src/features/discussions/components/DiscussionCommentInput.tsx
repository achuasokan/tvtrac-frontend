"use client";

import React, { useState, useRef } from 'react';
import { ShieldAlert, Send, Lock, User, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { PendingMediaAttachment } from '../types/discussion.types';
import { discussionService } from '../api/discussion.service';
import { GifPickerModal } from './GifPickerModal';

interface DiscussionCommentInputProps {
  isLoggedIn: boolean;
  isWatched: boolean;
  userAvatar?: string;
  onSubmit: (content: string, isSpoiler: boolean, mediaId?: string) => Promise<void>;
  onRequireAuth?: () => void;
  isSubmitting?: boolean;
}

// Custom Lucide-style GIF icon
function GifIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
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

export function DiscussionCommentInput({
  isLoggedIn,
  isWatched,
  userAvatar,
  onSubmit,
  onRequireAuth,
  isSubmitting = false,
}: DiscussionCommentInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(!isWatched);
  const [pendingMedia, setPendingMedia] = useState<PendingMediaAttachment | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image size must be 10MB or less.");
      return;
    }

    try {
      setIsUploadingMedia(true);
      setIsExpanded(true);
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
      setIsExpanded(true);
      const media = await discussionService.attachGif(gif.providerId);
      setPendingMedia(media);
    } catch (err: any) {
      console.error("GIF attach failed:", err);
      alert(err.response?.data?.message || "Failed to attach GIF. Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = content.trim().length > 0;
    const hasMedia = pendingMedia !== null;

    if ((!hasText && !hasMedia) || isSubmitting || isUploadingMedia) return;

    await onSubmit(content.trim(), isSpoiler, pendingMedia?.mediaId);
    setContent('');
    setPendingMedia(null);
    setIsSpoiler(!isWatched);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setContent('');
    setPendingMedia(null);
    setIsExpanded(false);
    setIsSpoiler(!isWatched);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#0e0e11] border border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="leading-snug">Sign in to join the conversation and share your reaction.</span>
        </div>
        {onRequireAuth && (
          <button
            onClick={onRequireAuth}
            className="w-full sm:w-auto px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shrink-0 text-center"
          >
            Sign In
          </button>
        )}
      </div>
    );
  }

  const canSubmit = (content.trim().length > 0 || pendingMedia !== null) && !isSubmitting && !isUploadingMedia;
  const showToolbar = isExpanded || content.trim().length > 0 || pendingMedia !== null;

  return (
    <>
      <div className="flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#0e0e12]/95 border border-zinc-800/80 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700/50 transition-all duration-200 shadow-sm">
        {/* User Avatar */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-white/5">
          {userAvatar ? (
            <img src={userAvatar} alt="You" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <User className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>

        {/* Input Container */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Share your thoughts..."
            rows={showToolbar ? 2 : 1}
            maxLength={2000}
            disabled={isSubmitting || isUploadingMedia}
            className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none leading-relaxed transition-all duration-200 min-h-[32px] sm:min-h-[36px] py-0.5"
          />

          {/* Pending Media Attachment Preview */}
          {(pendingMedia || isUploadingMedia) && (
            <div className="relative inline-flex items-center gap-2 sm:gap-2.5 p-1.5 pr-2.5 sm:pr-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 shadow-inner max-w-full sm:max-w-fit animate-in fade-in zoom-in-95 duration-150">
              {isUploadingMedia ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs text-amber-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-amber-400" />
                  <span>Processing media...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-zinc-800">
                    <img src={pendingMedia!.previewUrl} alt="Attached media" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate">
                      {pendingMedia!.type === 'gif' ? 'GIF Attached' : 'Photo Attached'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400">Ready to post</span>
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

          {showToolbar && (
            <div className="flex flex-wrap items-center justify-between pt-2 sm:pt-2.5 border-t border-zinc-800/60 gap-2 animate-in fade-in duration-200">
              {/* Left Toolbar: Photo & GIF Picker + Spoiler Toggle Chip */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Attach Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMedia || isSubmitting || pendingMedia !== null}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 bg-zinc-900/60 border border-zinc-800/80 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
                  title="Upload photo (max 10MB)"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Photo</span>
                </button>

                {/* Attach GIF Button */}
                <button
                  type="button"
                  onClick={() => setIsGifModalOpen(true)}
                  disabled={isUploadingMedia || isSubmitting || pendingMedia !== null}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 bg-zinc-900/60 border border-zinc-800/80 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
                  title="Search and attach a GIF"
                >
                  <GifIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">GIF</span>
                </button>

                {/* Spoiler Toggle Chip */}
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`inline-flex items-center justify-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-lg text-xs font-medium transition-all select-none border active:scale-95 shrink-0 ${
                    isSpoiler
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-semibold'
                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70'
                  }`}
                  title={isSpoiler ? 'Marked as spoiler (click to unmark)' : 'Mark as spoiler'}
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${isSpoiler ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span>Spoiler</span>
                  {isSpoiler && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                  )}
                </button>
              </div>

              {/* Right: Char Count & Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
                {content.length > 0 && (
                  <span
                    className={`text-[10px] sm:text-[11px] tabular-nums mr-0.5 transition-colors ${
                      content.length > 1900
                        ? 'text-rose-400 font-bold'
                        : content.length > 1600
                        ? 'text-amber-400 font-medium'
                        : 'text-zinc-500'
                    }`}
                  >
                    {content.length}/2000
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting || isUploadingMedia}
                  className="px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors shrink-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95 shadow-sm shrink-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* GIF Picker Modal */}
      <GifPickerModal
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
        onSelectGif={handleSelectGif}
      />
    </>
  );
}
