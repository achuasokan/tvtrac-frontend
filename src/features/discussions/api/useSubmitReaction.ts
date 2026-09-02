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
}

export function useSubmitReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tmdbId, season, episode, emotion, characterId, rating }: SubmitReactionVariables) =>
      discussionService.upsertReaction(tmdbId, season, episode, { emotion, characterId, rating }),
    onMutate: async ({ tmdbId, season, episode, emotion, characterId, rating }) => {
      const summaryKey = ['episode-discussion-summary', tmdbId, season, episode];
      await queryClient.cancelQueries({ queryKey: summaryKey });

      const prevSummary = queryClient.getQueryData<EpisodeSummary>(summaryKey);

      if (prevSummary) {
        queryClient.setQueryData<EpisodeSummary>(summaryKey, {
          ...prevSummary,
          userReaction: {
            emotion: emotion !== undefined ? emotion : prevSummary.userReaction?.emotion,
            characterId: characterId !== undefined ? characterId : prevSummary.userReaction?.characterId,
            rating: rating !== undefined ? rating : prevSummary.userReaction?.rating,
          },
        });
      }

      return { prevSummary, summaryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevSummary && context.summaryKey) {
        queryClient.setQueryData(context.summaryKey, context.prevSummary);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['episode-discussion-summary', variables.tmdbId, variables.season, variables.episode],
      });
    },
  });
}
