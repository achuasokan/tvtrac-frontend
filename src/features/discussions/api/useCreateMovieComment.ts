import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionService } from './discussion.service';

interface CreateMovieCommentVariables {
  tmdbId: string;
  content?: string;
  isSpoiler: boolean;
  mediaId?: string;
}

export function useCreateMovieComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tmdbId, content, isSpoiler, mediaId }: CreateMovieCommentVariables) =>
      discussionService.createMovieComment(tmdbId, { content, isSpoiler, mediaId }),
    onSuccess: (_data, variables) => {
      // Invalidate movie comments feeds & summary count
      queryClient.invalidateQueries({
        queryKey: ['movie-comments', variables.tmdbId],
      });
      queryClient.invalidateQueries({
        queryKey: ['movie-discussion-summary', variables.tmdbId],
      });
    },
  });
}
