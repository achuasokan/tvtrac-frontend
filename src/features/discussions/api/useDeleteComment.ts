import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './discussion.service';

interface DeleteCommentVariables {
  commentId: string;
  tmdbId: string;
  season: number;
  episode: number;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: DeleteCommentVariables) => discussionService.deleteComment(commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['episode-comments', variables.tmdbId, variables.season, variables.episode],
      });
      queryClient.invalidateQueries({
        queryKey: ['episode-discussion-summary', variables.tmdbId, variables.season, variables.episode],
      });
    },
  });
}
