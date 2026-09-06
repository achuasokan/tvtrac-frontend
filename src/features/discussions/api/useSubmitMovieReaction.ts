import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { MovieSummary } from '../types/discussion.types';

interface SubmitMovieReactionVariables {
  tmdbId: string;
  characterId?: number | null;
  rating?: number | null;
  platform?: string | null;
}

export function useSubmitMovieReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tmdbId, characterId, rating, platform }: SubmitMovieReactionVariables) =>
      discussionService.upsertMovieReaction(tmdbId, { characterId, rating, platform }),
    onMutate: async ({ tmdbId, characterId, rating, platform }) => {
      const summaryPrefix = ['movie-discussion-summary', tmdbId];
      await queryClient.cancelQueries({ queryKey: summaryPrefix });

      const previousSummaries = queryClient.getQueriesData<MovieSummary>({ queryKey: summaryPrefix });

      queryClient.setQueriesData<MovieSummary>(
        { queryKey: summaryPrefix },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            userReaction: {
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
        queryKey: ['movie-discussion-summary', variables.tmdbId],
      });
    },
  });
}
