"use client";

import React, { useState, useMemo } from 'react';
import { MessageSquare, Flame, Clock, Filter, ChevronRight, ArrowRight } from 'lucide-react';
import { useEpisodeSummary } from '../api/useEpisodeSummary';
import { useEpisodeComments } from '../api/useEpisodeComments';
import { useSubmitReaction } from '../api/useSubmitReaction';
import { useCreateComment } from '../api/useCreateComment';
import { useDeleteComment } from '../api/useDeleteComment';
import { useToggleCommentLike } from '../api/useToggleCommentLike';
import { TvTimeRatingCard } from './TvTimeRatingCard';
import { TvTimeVibeSelector } from './TvTimeVibeSelector';
import { TvTimeMvpCarousel } from './TvTimeMvpCarousel';
import { DiscussionCommentItem } from './DiscussionCommentItem';
import { DiscussionCommentInput } from './DiscussionCommentInput';
import { EpisodeDiscussionDrawer } from './EpisodeDiscussionDrawer';
import { CastMember, EmotionType } from '../types/discussion.types';

interface EpisodeDiscussionSectionProps {
  tmdbId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  isWatched: boolean;
  onToggleWatched?: () => void;
  isLoggedIn: boolean;
  currentUserId?: string;
  currentUserAvatar?: string;
  cast: CastMember[];
  onRequireAuth?: () => void;
}

export function EpisodeDiscussionSection({
  tmdbId,
  seasonNumber,
  episodeNumber,
  episodeTitle,
  isWatched,
  onToggleWatched,
  isLoggedIn,
  currentUserId,
  currentUserAvatar,
  cast,
  onRequireAuth,
}: EpisodeDiscussionSectionProps) {
  const [sort, setSort] = useState<'top' | 'newest'>('top');
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Queries (Only enabled when watched or explicitly requested)
  const { data: summary } = useEpisodeSummary(
    tmdbId,
    seasonNumber,
    episodeNumber,
    currentUserId
  );

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEpisodeComments(tmdbId, seasonNumber, episodeNumber, {
    sort,
    hideSpoilers,
    reveal: isWatched,
  });

  // Mutations
  const { mutateAsync: submitReaction, isPending: isSubmittingReaction } = useSubmitReaction();
  const { mutateAsync: createComment, isPending: isCreatingComment } = useCreateComment();
  const { mutateAsync: deleteComment, isPending: isDeletingComment } = useDeleteComment();
  const { mutate: toggleLike } = useToggleCommentLike();

  const allComments = useMemo(() => {
    return commentsData?.pages.flatMap((page) => page.comments) || [];
  }, [commentsData]);

  // Handlers for interactive TV Time widgets
  const handleRate = async (rating: number) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    await submitReaction({
      tmdbId,
      season: seasonNumber,
      episode: episodeNumber,
      rating,
      emotion: summary?.userReaction?.emotion,
      characterId: summary?.userReaction?.characterId,
    });
  };

  const handleSelectEmotion = async (emotion: EmotionType) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    const nextEmotion = summary?.userReaction?.emotion === emotion ? null : emotion;
    await submitReaction({
      tmdbId,
      season: seasonNumber,
      episode: episodeNumber,
      rating: summary?.userReaction?.rating,
      emotion: nextEmotion,
      characterId: summary?.userReaction?.characterId,
    });
  };

  const handleSelectCharacter = async (characterId: number) => {
    if (!isLoggedIn && onRequireAuth) {
      onRequireAuth();
      return;
    }
    const nextCharacter = summary?.userReaction?.characterId === characterId ? null : characterId;
    await submitReaction({
      tmdbId,
      season: seasonNumber,
      episode: episodeNumber,
      rating: summary?.userReaction?.rating,
      emotion: summary?.userReaction?.emotion,
      characterId: nextCharacter,
    });
  };

  const handlePostComment = async (content: string, isSpoiler: boolean) => {
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
    });
  };

  const totalCommentCount = summary?.totalComments ?? 0;

  // If user has NOT watched this episode yet, hide the entire section completely
  if (!isWatched) {
    return null;
  }

  // When episode IS watched: Full TV Time Visual Layout
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col gap-5 sm:gap-8 font-sans animate-in fade-in duration-300 overflow-visible">
      {/* 1. Episode Star Rating Card */}
      <TvTimeRatingCard
        averageRating={summary?.ratingStats?.averageRating ?? null}
        totalRatings={summary?.ratingStats?.totalRatings ?? 0}
        userRating={summary?.userReaction?.rating}
        onRate={handleRate}
        isSubmitting={isSubmittingReaction}
      />

      {/* 2. Interactive TV Time Vibe Reaction Selector */}
      <TvTimeVibeSelector
        selectedEmotion={summary?.userReaction?.emotion}
        emotionStats={summary?.emotionStats}
        onSelectEmotion={handleSelectEmotion}
        isSubmitting={isSubmittingReaction}
      />

      {/* 3. Character of the Episode (MVP) Carousel */}
      {cast && cast.length > 0 && (
        <TvTimeMvpCarousel
          cast={cast}
          selectedCharacterId={summary?.userReaction?.characterId}
          mvpLeaderboard={summary?.mvpLeaderboard}
          onSelectCharacter={handleSelectCharacter}
          isSubmitting={isSubmittingReaction}
        />
      )}

      {/* 4. Fan Discussion Feed Section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-zinc-800/80">
        {/* Discussion Header & Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-zinc-400" />
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Episode Discussion ({totalCommentCount})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Tabs */}
            <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setSort('top')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  sort === 'top'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Top
              </button>
              <button
                onClick={() => setSort('newest')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  sort === 'newest'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Newest
              </button>
            </div>

            {/* Spoiler Filter Toggle */}
            <button
              onClick={() => setHideSpoilers((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                hideSpoilers
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-[#101014] border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{hideSpoilers ? 'Spoilers Hidden' : 'Hide Spoilers'}</span>
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

        {/* Comments Feed List (Top 3 Preview + View All in Bottom-to-Top Drawer) */}
        <div className="flex flex-col gap-3 pt-2">
          {isCommentsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-3 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : allComments.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs sm:text-sm bg-[#0e0e11]/60 border border-zinc-800/60 rounded-2xl">
              No comments yet for this episode. Start the conversation!
            </div>
          ) : (
            <>
              {allComments.slice(0, 3).map((comment) => (
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
                  isDeleting={isDeletingComment}
                />
              ))}

              {/* View All Comments Button (Opens Bottom-to-Top Discussion Modal) */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="group flex items-center justify-between w-full p-4 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-900/90 hover:from-zinc-800 hover:to-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 mt-1 shadow-lg active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-white">
                        View all {totalCommentCount} comments
                      </span>
                      {totalCommentCount > 3 && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          +{totalCommentCount - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Join the discussion, read replies & spoiler conversations
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <span className="hidden sm:inline">Open Discussion</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom-to-Top Discussion Modal (Slides up from bottom) */}
      <EpisodeDiscussionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tmdbId={tmdbId}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        episodeTitle={episodeTitle}
        isWatched={isWatched}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
        onRequireAuth={onRequireAuth}
      />
    </div>
  );
}
