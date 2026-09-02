"use client";

import React, { useState } from 'react';
import { DiscussionComment } from '../types/discussion.types';
import { Heart, Trash2, ShieldAlert, Eye, User } from 'lucide-react';

interface DiscussionCommentItemProps {
  comment: DiscussionComment;
  currentUserId?: string;
  onToggleLike: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function DiscussionCommentItem({
  comment,
  currentUserId,
  onToggleLike,
  onDelete,
  isDeleting = false,
}: DiscussionCommentItemProps) {
  const [isRevealedLocally, setIsRevealedLocally] = useState(false);

  const isAuthor = currentUserId && comment.user?._id === currentUserId;
  const isSpoiler = Boolean(comment.isSpoiler);
  const isServerMasked = comment.content === null;

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHours > 0) return `${diffHours}h ago`;
      if (diffMins > 0) return `${diffMins}m ago`;
      return 'Just now';
    } catch {
      return '';
    }
  };

  const userAvatar = comment.user?.avatar || comment.user?.profileImage;

  return (
    <div className="group relative flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[#0e0e11]/80 hover:bg-[#131317] border border-zinc-800/60 hover:border-zinc-700/60 transition-all duration-200">
      {/* Left: User Avatar */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={comment.user?.username || 'User'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <User className="w-4 h-4 text-zinc-500" />
        )}
      </div>

      {/* Right: Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Name, Timestamp, Badges */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs sm:text-sm font-bold text-white hover:text-zinc-200 transition-colors truncate">
              {comment.user?.name || comment.user?.username || 'Anonymous'}
            </span>
            <span className="text-zinc-600 text-[10px]">•</span>
            <span className="text-[11px] text-zinc-500 shrink-0">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Top Right: Badges & Delete Action */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isSpoiler && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase">
                <ShieldAlert className="w-3 h-3" />
                Spoiler
              </span>
            )}

            {isAuthor && onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all disabled:opacity-50 rounded"
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Comment Text / Spoiler Mask */}
        <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-2 break-words">
          {isServerMasked ? (
            <div className="py-2 px-3 rounded-xl bg-black/40 border border-zinc-800/60 text-zinc-500 text-xs italic">
              🔒 Spoiler text masked for unwatched viewers.
            </div>
          ) : isSpoiler && !isRevealedLocally ? (
            <button
              type="button"
              onClick={() => setIsRevealedLocally(true)}
              className="group/reveal flex items-center gap-2 py-2 px-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400 group-hover/reveal:scale-110 transition-transform" />
              <span>Contains spoiler • Click to reveal</span>
            </button>
          ) : (
            <p className="whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        {/* Inline Actions (Like Button) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-0.5 rounded ${
              comment.isLikedByMe
                ? 'text-rose-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                comment.isLikedByMe ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
            <span className="text-[11px]">{comment.likeCount > 0 ? comment.likeCount : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
