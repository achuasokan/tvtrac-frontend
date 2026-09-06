import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './discussion.service';

interface DeleteMovieCommentVariables {
  commentId: string;
  tmdbId: string;
}

export function useDeleteMovieComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: DeleteMovieCommentVariables) => discussionService.deleteComment(commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['movie-comments', variables.tmdbId],
      });
      queryClient.invalidateQueries({
        queryKey: ['movie-discussion-summary', variables.tmdbId],
      });
    },
  });
}
