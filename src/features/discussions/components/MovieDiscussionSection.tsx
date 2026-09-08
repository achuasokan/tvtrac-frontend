"use client";

import React, { useState, useMemo } from 'react';
import { MessageSquare, Flame, Clock, Filter, ChevronRight, Film } from 'lucide-react';
import { useMovieSummary } from '../api/useMovieSummary';
import { useMovieComments } from '../api/useMovieComments';
import { useSubmitMovieReaction } from '../api/useSubmitMovieReaction';
import { useCreateMovieComment } from '../api/useCreateMovieComment';
import { useDeleteMovieComment } from '../api/useDeleteMovieComment';
import { useToggleMovieCommentLike } from '../api/useToggleMovieCommentLike';
import { TvTimeRatingCard } from './TvTimeRatingCard';
import { TvTimeMvpCarousel } from './TvTimeMvpCarousel';
import { EpisodePlatformSelector } from './EpisodePlatformSelector';
import { DiscussionCommentItem } from './DiscussionCommentItem';
import { DiscussionCommentInput } from './DiscussionCommentInput';
import { CastMember } from '../types/discussion.types';
import { PostWatchMovieReactionDrawer } from './PostWatchMovieReactionDrawer';
import { MovieDiscussionDrawer } from './MovieDiscussionDrawer';

interface MovieDiscussionSectionProps {
  tmdbId: string;
  movieTitle?: string;
  releaseYear?: string | number;
  isWatched: boolean;
  onToggleWatched?: () => void;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserAvatar?: string;
  cast: CastMember[];
  onRequireAuth?: () => void;
  watchProviders?: any[];
}

export function MovieDiscussionSection({
  tmdbId,
  movieTitle,
  releaseYear,
  isWatched,
  onToggleWatched,
  isLoggedIn,
  currentUserId,
  currentUserAvatar,
  cast,
  onRequireAuth,
  watchProviders = [],
}: MovieDiscussionSectionProps) {
  const [sort, setSort] = useState<'top' | 'newest'>('top');
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [isReactionDrawerOpen, setIsReactionDrawerOpen] = useState(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);

  // Queries
  const { data: summary } = useMovieSummary(tmdbId, currentUserId);

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMovieComments(tmdbId, {
    sort,
    hideSpoilers,
    reveal: isWatched,
  });

  // Mutations
  const { mutateAsync: submitReaction, isPending: isSubmittingReaction } = useSubmitMovieReaction();
  const { mutateAsync: createComment, isPending: isCreatingComment } = useCreateMovieComment();
  const { mutateAsync: deleteComment, isPending: isDeletingComment } = useDeleteMovieComment();
  const { mutate: toggleLike } = useToggleMovieCommentLike();

  const allComments = useMemo(() => {
    return commentsData?.pages.flatMap((page) => page.comments) || [];
  }, [commentsData]);

  const totalCommentCount = summary?.totalComments ?? allComments.length;

  if (!isWatched) {
    return null;
  }

  // Handlers
  const handleRate = async (rating: number) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    await submitReaction({
      tmdbId,
      rating,
      characterId: summary?.userReaction?.characterId,
      platform: summary?.userReaction?.platform,
    });
  };

  const handleSelectCharacter = async (characterId: number) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    const nextChar = summary?.userReaction?.characterId === characterId ? null : characterId;
    await submitReaction({
      tmdbId,
      rating: summary?.userReaction?.rating,
      characterId: nextChar,
      platform: summary?.userReaction?.platform,
    });
  };

  const handleSelectPlatform = async (platform: string | null) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    await submitReaction({
      tmdbId,
      rating: summary?.userReaction?.rating,
      characterId: summary?.userReaction?.characterId,
      platform,
    });
  };

  const handlePostComment = async (content: string, isSpoiler: boolean, mediaId?: string) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    await createComment({
      tmdbId,
      content,
      isSpoiler,
      mediaId,
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment({ commentId, tmdbId });
  };

  const handleToggleLike = (commentId: string) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    toggleLike({ commentId, tmdbId });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col gap-5 sm:gap-8 font-sans animate-in fade-in duration-300 overflow-visible text-left">
      {/* 1. Movie Star Rating Card */}
      <TvTimeRatingCard
        averageRating={summary?.ratingStats?.averageRating ?? null}
        totalRatings={summary?.ratingStats?.totalRatings ?? 0}
        userRating={summary?.userReaction?.rating}
        onRate={handleRate}
        isSubmitting={isSubmittingReaction}
      />

      {/* 2. Where Did You Watch It? (Streaming Platform) */}
      <div className="flex flex-col gap-3 py-2 sm:py-3 w-full select-none">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2dd4bf]/10 border border-[#2dd4bf]/25 flex items-center justify-center text-[#2dd4bf] shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-300">
                Where Did You Watch It?
              </span>
              <span className="text-[11px] font-medium">
                {summary?.userReaction?.platform ? (
                  <span className="text-[#2dd4bf] font-semibold flex items-center gap-1">
                    Watched on {summary.userReaction.platform}
                  </span>
                ) : (
                  <span className="text-zinc-500">
                    Select where you watched this movie
                  </span>
                )}
              </span>
            </div>
          </div>
          {summary?.userReaction?.platform && (
            <button
              type="button"
              onClick={() => handleSelectPlatform(null)}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <EpisodePlatformSelector
          isMovie={true}
          watchProviders={watchProviders}
          selectedPlatform={summary?.userReaction?.platform || null}
          onSelect={handleSelectPlatform}
        />
      </div>

      {/* 3. Character of the Movie (MVP) Carousel */}
      {cast && cast.length > 0 && (
        <TvTimeMvpCarousel
          cast={cast}
          title="Character of the Movie (MVP)"
          selectedCharacterId={summary?.userReaction?.characterId}
          mvpLeaderboard={summary?.mvpLeaderboard}
          onSelectCharacter={handleSelectCharacter}
          isSubmitting={isSubmittingReaction}
        />
      )}

      {/* 4. Movie Discussion Feed Section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800/60">
        {/* Discussion Header & Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-zinc-500" />
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide">
              Discussion
              {totalCommentCount > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-zinc-500">{totalCommentCount}</span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Tabs — ghost pill style */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setSort('top')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  sort === 'top'
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Flame className="w-3 h-3" />
                Top
              </button>
              <button
                type="button"
                onClick={() => setSort('newest')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  sort === 'newest'
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Clock className="w-3 h-3" />
                New
              </button>
            </div>

            {/* Spoiler Filter */}
            <button
              type="button"
              onClick={() => setHideSpoilers((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                hideSpoilers
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{hideSpoilers ? 'Spoilers Off' : 'Spoilers'}</span>
            </button>
          </div>
        </div>

        {/* Expand-on-Focus Comment Input */}
        <DiscussionCommentInput
          isLoggedIn={isLoggedIn}
          isWatched={isWatched}
          userAvatar={currentUserAvatar}
          onSubmit={handlePostComment}
          onRequireAuth={onRequireAuth}
          isSubmitting={isCreatingComment}
        />

        {/* Comments Feed List */}
        <div className="pt-2">
          {isCommentsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-3 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : allComments.length === 0 ? (
            <div className="py-10 text-center text-zinc-600 text-xs">
              No comments yet — be the first to start the conversation!
            </div>
          ) : (
            <>
              <div className="divide-y divide-zinc-800/50 flex flex-col gap-1 text-left">
                {allComments.slice(0, 3).map((comment) => (
                  <DiscussionCommentItem
                    key={comment._id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onToggleLike={() => handleToggleLike(comment._id)}
                    onDelete={() => handleDeleteComment(comment._id)}
                    isDeleting={isDeletingComment}
                  />
                ))}
              </div>

              {/* View All Comments Button (Opens Bottom-to-Top Discussion Modal) */}
              <button
                type="button"
                onClick={() => setIsCommentsDrawerOpen(true)}
                className="group flex items-center justify-between w-full p-2.5 sm:p-3.5 md:p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90 hover:from-zinc-800 hover:to-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 mt-2.5 shadow-lg active:scale-[0.99] text-left cursor-pointer gap-2 sm:gap-3 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 text-left min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-teal-500/10 flex items-center justify-center text-zinc-400 group-hover:text-teal-400 transition-colors shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-left">
                      <span className="text-xs sm:text-sm font-extrabold text-white">
                        View all {totalCommentCount} comments
                      </span>
                      {totalCommentCount > 3 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                          +{totalCommentCount - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5 text-left leading-tight break-words">
                      <span className="inline sm:hidden">Join the community discussion</span>
                      <span className="hidden sm:inline">Join the discussion, read replies & spoiler conversations</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-white transition-all shrink-0 ml-1.5">
                  <span className="hidden md:inline">Open Discussion</span>
                  <ChevronRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Integrated Post-Watch Reaction Drawer Modal */}
      <PostWatchMovieReactionDrawer
        isOpen={isReactionDrawerOpen}
        onClose={() => setIsReactionDrawerOpen(false)}
        tmdbId={tmdbId}
        movieTitle={movieTitle}
        releaseYear={releaseYear}
        cast={cast}
        watchProviders={watchProviders}
        initialReaction={summary?.userReaction}
      />

      {/* Bottom-to-Top Discussion Modal (Slides up from bottom) */}
      <MovieDiscussionDrawer
        isOpen={isCommentsDrawerOpen}
        onClose={() => setIsCommentsDrawerOpen(false)}
        tmdbId={tmdbId}
        movieTitle={movieTitle}
        releaseYear={releaseYear}
        isWatched={isWatched}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
        onRequireAuth={onRequireAuth}
      />
    </div>
  );
}
