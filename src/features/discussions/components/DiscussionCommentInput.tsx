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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-zinc-800/60 text-xs text-zinc-500">
        <div className="flex items-center gap-2 min-w-0">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span className="leading-snug">Sign in to join the conversation.</span>
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
      <div className="flex gap-3 py-2 border-b border-zinc-800/50 focus-within:border-zinc-700/70 transition-colors duration-200">
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
          {userAvatar ? (
            <img src={userAvatar} alt="You" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <User className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>

        {/* Input Container */}
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col gap-2.5">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Share your thoughts..."
            rows={showToolbar ? 3 : 1}
            maxLength={2000}
            disabled={isSubmitting || isUploadingMedia}
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none leading-relaxed transition-all duration-200 min-h-[28px] py-0.5"
          />

          {/* Pending Media Attachment Preview */}
          {(pendingMedia || isUploadingMedia) && (
            <div className="relative inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 max-w-full sm:max-w-fit animate-in fade-in zoom-in-95 duration-150">
              {isUploadingMedia ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Processing media...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0">
                    <img src={pendingMedia!.previewUrl} alt="Attached media" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate">
                      {pendingMedia!.type === 'gif' ? 'GIF' : 'Photo'} attached
                    </span>
                    <span className="text-[10px] text-zinc-500">Ready to post</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingMedia(null)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors ml-auto shrink-0"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}

          {showToolbar && (
            <div className="flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
              {/* Left Toolbar */}
              <div className="flex items-center gap-0.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* Attach Photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingMedia || isSubmitting || pendingMedia !== null}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Upload photo"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photo</span>
                </button>

                {/* Attach GIF */}
                <button
                  type="button"
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    setIsGifModalOpen(true);
                  }}
                  disabled={isUploadingMedia || isSubmitting || pendingMedia !== null}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title="Search GIF"
                >
                  <GifIcon className="w-3.5 h-3.5" />
                  <span>GIF</span>
                </button>

                {/* Spoiler Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-all select-none active:scale-95 ${
                    isSpoiler
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                  title={isSpoiler ? 'Marked as spoiler' : 'Mark as spoiler'}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Spoiler</span>
                  {isSpoiler && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                </button>
              </div>

              {/* Right: Char Count & Actions */}
              <div className="flex items-center gap-2 ml-auto">
                {content.length > 0 && (
                  <span className={`text-[10px] tabular-nums transition-colors ${
                    content.length > 1900 ? 'text-rose-400 font-bold' :
                    content.length > 1600 ? 'text-amber-400' : 'text-zinc-600'
                  }`}>
                    {content.length}/2000
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting || isUploadingMedia}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:hover:bg-white active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
