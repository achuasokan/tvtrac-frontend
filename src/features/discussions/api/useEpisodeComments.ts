import { useInfiniteQuery } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { CommentsResponse } from '../types/discussion.types';

interface UseEpisodeCommentsOptions {
  sort: 'top' | 'newest';
  hideSpoilers: boolean;
  reveal: boolean;
  limit?: number;
}

export function useEpisodeComments(
  tmdbId: string,
  season: number,
  episode: number,
  options: UseEpisodeCommentsOptions
) {
  return useInfiniteQuery<CommentsResponse>({
    queryKey: ['episode-comments', tmdbId, season, episode, options.sort, options.hideSpoilers, options.reveal],
    queryFn: ({ pageParam }) =>
      discussionService.getComments(tmdbId, season, episode, {
        sort: options.sort,
        cursor: pageParam as string | undefined,
        limit: options.limit || 20,
        hideSpoilers: options.hideSpoilers,
        reveal: options.reveal,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 1000 * 60 * 1,
    enabled: Boolean(tmdbId && season !== undefined && episode !== undefined),
  });
}
