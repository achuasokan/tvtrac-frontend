"use client";

import React, { useState, useRef } from 'react';
import { ShieldAlert, Send, Lock, User } from 'lucide-react';

interface DiscussionCommentInputProps {
  isLoggedIn: boolean;
  isWatched: boolean;
  userAvatar?: string;
  onSubmit: (content: string, isSpoiler: boolean) => Promise<void>;
  onRequireAuth?: () => void;
  isSubmitting?: boolean;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    await onSubmit(content.trim(), isSpoiler);
    setContent('');
    setIsSpoiler(!isWatched);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setContent('');
    setIsExpanded(false);
    setIsSpoiler(!isWatched);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#0e0e11] border border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-zinc-500" />
          <span>Sign in to join the conversation and share your reaction.</span>
        </div>
        {onRequireAuth && (
          <button
            onClick={onRequireAuth}
            className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shrink-0"
          >
            Sign In
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-3 sm:p-4 rounded-2xl bg-[#0e0e11] border border-zinc-800/80 focus-within:border-zinc-700 transition-all duration-200">
      {/* User Avatar */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        {userAvatar ? (
          <img src={userAvatar} alt="You" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <User className="w-4 h-4 text-zinc-500" />
        )}
      </div>

      {/* Input Container */}
      <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col gap-2.5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Share your thoughts on this episode..."
          rows={isExpanded ? 3 : 1}
          maxLength={2000}
          disabled={isSubmitting}
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 resize-none focus:outline-none leading-relaxed transition-all duration-200"
        />

        {isExpanded && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 flex-wrap gap-2 animate-in fade-in duration-200">
            {/* Spoiler Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
              <input
                type="checkbox"
                checked={isSpoiler}
                onChange={(e) => setIsSpoiler(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1 font-semibold text-[11px] sm:text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Contains Spoilers
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-zinc-500 mr-1">
                {content.length}/2000
              </span>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-white active:scale-95 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
