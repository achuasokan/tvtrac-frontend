import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './discussion.service';

interface CreateCommentVariables {
  tmdbId: string;
  season: number;
  episode: number;
  content?: string;
  isSpoiler: boolean;
  mediaId?: string;
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tmdbId, season, episode, content, isSpoiler, mediaId }: CreateCommentVariables) =>
      discussionService.createComment(tmdbId, season, episode, { content, isSpoiler, mediaId }),
    onSuccess: (_data, variables) => {
      // Invalidate comments feeds & summary count
      queryClient.invalidateQueries({
        queryKey: ['episode-comments', variables.tmdbId, variables.season, variables.episode],
      });
      queryClient.invalidateQueries({
        queryKey: ['episode-discussion-summary', variables.tmdbId, variables.season, variables.episode],
      });
    },
  });
}
