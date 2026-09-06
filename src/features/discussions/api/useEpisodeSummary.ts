import { useQuery } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { EpisodeSummary } from '../types/discussion.types';

export function useEpisodeSummary(tmdbId: string, season: number, episode: number, userId?: string) {
  return useQuery<EpisodeSummary>({
    queryKey: ['episode-discussion-summary', tmdbId, season, episode, userId || 'guest'],
    queryFn: () => discussionService.getSummary(tmdbId, season, episode),
    staleTime: 1000 * 30, // 30 seconds fresh
    enabled: Boolean(tmdbId && season !== undefined && episode !== undefined),
  });
}
