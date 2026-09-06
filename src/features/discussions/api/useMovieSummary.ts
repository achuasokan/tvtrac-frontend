import { useQuery } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { MovieSummary } from '../types/discussion.types';

export function useMovieSummary(tmdbId: string, userId?: string) {
  return useQuery<MovieSummary>({
    queryKey: ['movie-discussion-summary', tmdbId, userId || 'guest'],
    queryFn: () => discussionService.getMovieSummary(tmdbId),
    staleTime: 1000 * 30, // 30 seconds fresh
    enabled: Boolean(tmdbId),
  });
}
