import { useInfiniteQuery } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { CommentsResponse } from '../types/discussion.types';

interface UseMovieCommentsOptions {
  sort: 'top' | 'newest';
  hideSpoilers: boolean;
  reveal: boolean;
  limit?: number;
}

export function useMovieComments(
  tmdbId: string,
  options: UseMovieCommentsOptions
) {
  return useInfiniteQuery<CommentsResponse>({
    queryKey: ['movie-comments', tmdbId, options.sort, options.hideSpoilers, options.reveal],
    queryFn: ({ pageParam }) =>
      discussionService.getMovieComments(tmdbId, {
        sort: options.sort,
        cursor: pageParam as string | undefined,
        limit: options.limit || 20,
        hideSpoilers: options.hideSpoilers,
        reveal: options.reveal,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 1000 * 60 * 1,
    enabled: Boolean(tmdbId),
  });
}
