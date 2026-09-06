"use client";

import React, { useState, useMemo } from 'react';
import { MessageSquare, Flame, Clock, Filter, ChevronRight, ArrowRight, Tv } from 'lucide-react';
import { useEpisodeSummary } from '../api/useEpisodeSummary';
import { useEpisodeComments } from '../api/useEpisodeComments';
import { useSubmitReaction } from '../api/useSubmitReaction';
import { useCreateComment } from '../api/useCreateComment';
import { useDeleteComment } from '../api/useDeleteComment';
import { useToggleCommentLike } from '../api/useToggleCommentLike';
import { TvTimeRatingCard } from './TvTimeRatingCard';
import { TvTimeVibeSelector } from './TvTimeVibeSelector';
import { TvTimeMvpCarousel } from './TvTimeMvpCarousel';
import { EpisodePlatformSelector } from './EpisodePlatformSelector';
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
  watchProviders?: any[];
  networks?: any[];
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
  watchProviders = [],
  networks = [],
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
      platform: summary?.userReaction?.platform,
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
      platform: summary?.userReaction?.platform,
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
      season: seasonNumber,
      episode: episodeNumber,
      rating: summary?.userReaction?.rating,
      emotion: summary?.userReaction?.emotion,
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
      season: seasonNumber,
      episode: episodeNumber,
      content,
      isSpoiler,
      mediaId,
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

      {/* 2. Where Did You Watch It? (Streaming Platform) */}
      <div className="flex flex-col gap-3 py-2 sm:py-3 w-full select-none">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#2dd4bf]/10 border border-[#2dd4bf]/25 flex items-center justify-center text-[#2dd4bf] shrink-0">
              <Tv className="w-4 h-4" />
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
                    Select where you watched this episode
                  </span>
                )}
              </span>
            </div>
          </div>
          {summary?.userReaction?.platform && (
            <button
              type="button"
              onClick={() => handleSelectPlatform(null)}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-800"
            >
              Clear
            </button>
          )}
        </div>
        <EpisodePlatformSelector
          watchProviders={watchProviders}
          networks={networks}
          selectedPlatform={summary?.userReaction?.platform || null}
          onSelect={handleSelectPlatform}
        />
      </div>

      {/* 3. Interactive TV Time Vibe Reaction Selector */}
      <TvTimeVibeSelector
        selectedEmotion={summary?.userReaction?.emotion}
        emotionStats={summary?.emotionStats}
        onSelectEmotion={handleSelectEmotion}
        isSubmitting={isSubmittingReaction}
      />

      {/* 4. Character of the Episode (MVP) Carousel */}
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
        <div className="pt-2">
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
              <div className="rounded-2xl bg-[#0e0e12]/60 border border-zinc-800/70 p-3 sm:p-4 divide-y divide-zinc-800/50 shadow-sm">
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
              </div>

              {/* View All Comments Button (Opens Bottom-to-Top Discussion Modal) */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
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
