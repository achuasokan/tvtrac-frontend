"use client";

import React, { useState, useRef } from 'react';
import { DiscussionComment, CommentMedia } from '../types/discussion.types';
import { Heart, Trash2, ShieldAlert, Eye, User, Loader2, MessageSquare } from 'lucide-react';
import { discussionService } from '../api/discussion.service';
import { MediaLightboxModal } from './MediaLightboxModal';

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
  const [revealedData, setRevealedData] = useState<{ content: string | null; media: CommentMedia | null } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [activeLightboxMedia, setActiveLightboxMedia] = useState<CommentMedia | null>(null);

  const isAuthor = Boolean(currentUserId && comment.user?._id === currentUserId);
  const isSpoiler = Boolean(comment.isSpoiler);
  const isServerMasked = comment.content === null;
  const isMediaMasked = Boolean(comment.isMediaMasked);

  const handleReveal = async () => {
    if (isServerMasked || isMediaMasked) {
      try {
        setIsRevealing(true);
        const data = await discussionService.revealComment(comment._id);
        setRevealedData({
          content: data.content ?? null,
          media: (data.media as CommentMedia) ?? null,
        });
        setIsRevealedLocally(true);
      } catch (err) {
        console.error("Reveal failed:", err);
      } finally {
        setIsRevealing(false);
      }
    } else {
      setIsRevealedLocally(true);
    }
  };

  const displayContent = revealedData ? revealedData.content : comment.content;
  const displayMedia = revealedData ? revealedData.media : comment.media;

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
  const userName = comment.user?.name || comment.user?.username || 'Anonymous';

  return (
    <>
      <div className="group relative flex gap-2.5 sm:gap-3 py-3 sm:py-2.5 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-900/20 -mx-2 px-2 sm:-mx-3 sm:px-3 rounded-xl transition-colors">
        {/* Left: User Avatar */}
        <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-white/5 shadow-sm">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <User className="w-4 h-4 text-zinc-500" />
          )}
        </div>

        {/* Right: Comment Body */}
        <div className="flex-1 min-w-0">
          {/* Header: Name, Timestamp, Spoiler Badge & Delete */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xs sm:text-[13px] font-bold text-white hover:text-amber-400 transition-colors truncate">
                {userName}
              </span>
              <span className="text-zinc-600 text-[10px]">•</span>
              <span className="text-[11px] text-zinc-500 shrink-0">
                {timeAgo(comment.createdAt)}
              </span>
            </div>

            {/* Badges & Delete */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isSpoiler && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase">
                  <ShieldAlert className="w-3 h-3" />
                  Spoiler
                </span>
              )}

              {isAuthor && onDelete && (
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all disabled:opacity-50 rounded"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Comment Text / Spoiler Mask */}
          <div className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed mb-1.5 break-words">
            {isSpoiler && !isRevealedLocally ? (
              <button
                type="button"
                onClick={handleReveal}
                disabled={isRevealing}
                className="group/reveal flex items-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all mt-1"
              >
                {isRevealing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-amber-400 group-hover/reveal:scale-110 transition-transform" />
                )}
                <span>
                  {isRevealing
                    ? 'Revealing spoiler...'
                    : 'Contains spoiler • Click to reveal'}
                </span>
              </button>
            ) : (
              <>
                {displayContent && (
                  <p className="whitespace-pre-wrap">{displayContent}</p>
                )}

                {/* Attached Media (Photo / GIF) - Full width on mobile, snugly reduced on desktop */}
                {displayMedia?.url && (() => {
                  const isGif = displayMedia.type === 'gif';
                  let mediaUrl = displayMedia.url;
                  if (isGif && (mediaUrl.includes('giphy.com') || mediaUrl.includes('i.giphy.com'))) {
                    const match = mediaUrl.match(/(?:giphy\.com\/media\/|i\.giphy\.com\/media\/|i\.giphy\.com\/)([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      mediaUrl = `https://i.giphy.com/media/${match[1]}/200.gif`;
                    }
                  }

                  return (
                    <div className="mt-2 mb-1.5 w-full max-w-sm sm:w-fit sm:max-w-[340px] md:max-w-[360px]">
                      <div
                        onClick={() => setActiveLightboxMedia({ ...displayMedia, url: mediaUrl })}
                        className="group/media relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700 transition-all shadow-md cursor-zoom-in"
                      >
                        <img
                          src={mediaUrl}
                          alt="Discussion attachment"
                          loading="lazy"
                          className="w-full sm:w-auto max-h-[320px] sm:max-h-[265px] md:max-h-[275px] object-cover rounded-2xl transition-transform duration-200 group-hover/media:scale-[1.01]"
                        />

                        {isGif && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/15 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-md shadow select-none">
                            GIF
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Social Action Row (Like & Reply - TV Time Style) */}
          <div className="flex items-center gap-4 pt-1 text-zinc-500">
            <button
              onClick={onToggleLike}
              className={`flex items-center gap-1.5 text-xs sm:text-[11px] font-semibold transition-colors py-0.5 rounded ${
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
              <span className="text-[11px] tabular-nums">
                {comment.likeCount > 0 ? comment.likeCount : ''}
              </span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 text-xs sm:text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors py-0.5"
              title="Reply"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[11px]">Reply</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <MediaLightboxModal
        media={activeLightboxMedia}
        onClose={() => setActiveLightboxMedia(null)}
      />
    </>
  );
}
