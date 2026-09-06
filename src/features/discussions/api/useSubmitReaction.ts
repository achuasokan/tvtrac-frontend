import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { EmotionType, EpisodeSummary } from '../types/discussion.types';

interface SubmitReactionVariables {
  tmdbId: string;
  season: number;
  episode: number;
  emotion?: EmotionType | null;
  characterId?: number | null;
  rating?: number | null;
  platform?: string | null;
}

export function useSubmitReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tmdbId, season, episode, emotion, characterId, rating, platform }: SubmitReactionVariables) =>
      discussionService.upsertReaction(tmdbId, season, episode, { emotion, characterId, rating, platform }),
    onMutate: async ({ tmdbId, season, episode, emotion, characterId, rating, platform }) => {
      const summaryPrefix = ['episode-discussion-summary', tmdbId, season, episode];
      await queryClient.cancelQueries({ queryKey: summaryPrefix });

      const previousSummaries = queryClient.getQueriesData<EpisodeSummary>({ queryKey: summaryPrefix });

      queryClient.setQueriesData<EpisodeSummary>(
        { queryKey: summaryPrefix },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            userReaction: {
              emotion: emotion !== undefined ? emotion : old.userReaction?.emotion,
              characterId: characterId !== undefined ? characterId : old.userReaction?.characterId,
              rating: rating !== undefined ? rating : old.userReaction?.rating,
              platform: platform !== undefined ? platform : old.userReaction?.platform,
            },
          };
        }
      );

      return { previousSummaries, summaryPrefix };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSummaries) {
        context.previousSummaries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['episode-discussion-summary', variables.tmdbId, variables.season, variables.episode],
      });
    },
  });
}
