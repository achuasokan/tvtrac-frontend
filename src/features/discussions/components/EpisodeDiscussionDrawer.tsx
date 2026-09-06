"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Flame, Clock, Filter, ShieldAlert } from 'lucide-react';
import { useEpisodeComments } from '../api/useEpisodeComments';
import { useCreateComment } from '../api/useCreateComment';
import { useDeleteComment } from '../api/useDeleteComment';
import { useToggleCommentLike } from '../api/useToggleCommentLike';
import { DiscussionComment } from '../types/discussion.types';
import { DiscussionCommentItem } from './DiscussionCommentItem';
import { DiscussionCommentInput } from './DiscussionCommentInput';

interface EpisodeDiscussionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  isWatched: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserAvatar?: string;
  onRequireAuth?: () => void;
}

export function EpisodeDiscussionDrawer({
  isOpen,
  onClose,
  tmdbId,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  isWatched,
  isLoggedIn,
  currentUserId,
  currentUserAvatar,
  onRequireAuth,
}: EpisodeDiscussionDrawerProps) {
  const [sort, setSort] = useState<'top' | 'newest'>('top');
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Comments Query
  const {
    data: commentsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEpisodeComments(tmdbId, seasonNumber, episodeNumber, {
    sort,
    hideSpoilers,
    reveal: isRevealed,
  });

  // Mutations
  const { mutateAsync: createComment, isPending: isCreating } = useCreateComment();
  const { mutateAsync: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { mutate: toggleLike } = useToggleCommentLike();

  const comments = useMemo(() => {
    return commentsData?.pages.flatMap((page) => page.comments) || [];
  }, [commentsData]);

  const handlePostComment = async (content: string, isSpoiler: boolean, mediaId?: string) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }

    await createComment({
      tmdbId,
      season: seasonNumber,
      episode: episodeNumber,
      content,
      isSpoiler,
      mediaId,
    });
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

          {/* Curved Bottom-to-Top Sheet Modal (Sleek Obsidian Theme) */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full max-w-2xl sm:max-w-3xl max-h-[92vh] h-[88vh] bg-[#09090b] border-t border-x border-zinc-800/80 rounded-t-[28px] sm:rounded-t-[36px] shadow-[0_-15px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl flex flex-col text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle Bar */}
            <div className="w-10 h-1.5 rounded-full bg-zinc-700/80 mx-auto shrink-0 mt-3 mb-1" />

            {/* 1. Drawer Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/70 bg-[#09090b]/95 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white truncate">
                    S{String(seasonNumber).padStart(2, '0')}E{String(episodeNumber).padStart(2, '0')} Discussion
                  </h3>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {episodeTitle || 'Episode Community Feed'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  aria-label="Close discussion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Filter & Sort Bar */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-800/50 bg-[#09090b] shrink-0">
              {/* Sort Tabs */}
              <div className="flex items-center bg-[#18181b] p-0.5 rounded-lg border border-zinc-800/80">
                <button
                  onClick={() => setSort('top')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    sort === 'top'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  Top
                </button>
                <button
                  onClick={() => setSort('newest')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                    sort === 'newest'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Newest
                </button>
              </div>

              {/* Hide Spoilers Toggle */}
              <button
                onClick={() => setHideSpoilers((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                  hideSpoilers
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-[#18181b] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{hideSpoilers ? 'Spoilers Hidden' : 'Hide Spoilers'}</span>
              </button>
            </div>

            {/* 3. Unwatched Spoiler Shield Warning Banner */}
            {!isWatched && !isRevealed && (
              <div className="mx-4 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-200/90 font-medium">
                    Unwatched episode. Spoilers are masked.
                  </span>
                </div>
                <button
                  onClick={() => setIsRevealed(true)}
                  className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-black text-xs font-bold shrink-0 hover:bg-amber-300 transition-colors shadow-sm"
                >
                  Reveal All
                </button>
              </div>
            )}

            {/* 4. Scrollable Comments Stream (Compact, Streamlined) */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-2 flex flex-col no-scrollbar bg-[#09090b]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
                  <div className="w-7 h-7 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                  <span className="text-xs">Loading discussion...</span>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 gap-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-1">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-400">No comments yet</h4>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Be the first to share your thoughts and reactions for this episode!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <DiscussionCommentItem
                    key={comment._id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onToggleLike={() =>
                      toggleLike({
                        commentId: comment._id,
                        tmdbId,
                        season: seasonNumber,
                        episode: episodeNumber,
                      })
                    }
                    onDelete={() =>
                      deleteComment({
                        commentId: comment._id,
                        tmdbId,
                        season: seasonNumber,
                        episode: episodeNumber,
                      })
                    }
                    isDeleting={isDeleting}
                  />
                ))
              )}

              {/* Load More Pagination */}
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full py-2.5 rounded-xl bg-[#14141a] hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 transition-colors disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading more...' : 'Load More Comments'}
                </button>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 5. Sticky Bottom Input Bar */}
            <div className="p-3 sm:p-4 pb-6 sm:pb-5 border-t border-zinc-800/80 bg-[#0c0c0e] shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
              <DiscussionCommentInput
                isLoggedIn={isLoggedIn}
                isWatched={isWatched}
                userAvatar={currentUserAvatar}
                onSubmit={handlePostComment}
                onRequireAuth={onRequireAuth}
                isSubmitting={isCreating}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
