import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { CommentsResponse } from '../types/discussion.types';

interface ToggleMovieLikeVariables {
  commentId: string;
  tmdbId: string;
}

export function useToggleMovieCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: ToggleMovieLikeVariables) => discussionService.toggleLike(commentId),
    onMutate: async ({ commentId, tmdbId }) => {
      const queryFilter = {
        queryKey: ['movie-comments', tmdbId],
      };

      await queryClient.cancelQueries(queryFilter);

      const previousQueries = queryClient.getQueriesData<InfiniteData<CommentsResponse>>(queryFilter);

      // Optimistically update all comment pages for this movie
      queryClient.setQueriesData<InfiniteData<CommentsResponse>>(queryFilter, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: page.comments.map((comment) => {
              if (comment._id === commentId) {
                const isLiked = !comment.isLikedByMe;
                const likeDelta = isLiked ? 1 : -1;
                return {
                  ...comment,
                  isLikedByMe: isLiked,
                  likeCount: Math.max(0, comment.likeCount + likeDelta),
                };
              }
              return comment;
            }),
          })),
        };
      });

      return { previousQueries };
    },
    onSuccess: (data, variables) => {
      const queryFilter = {
        queryKey: ['movie-comments', variables.tmdbId],
      };
      queryClient.setQueriesData<InfiniteData<CommentsResponse>>(queryFilter, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: page.comments.map((comment) => {
              if (comment._id === variables.commentId) {
                return {
                  ...comment,
                  isLikedByMe: data.isLiked,
                  likeCount: data.likeCount,
                };
              }
              return comment;
            }),
          })),
        };
      });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['movie-comments', variables.tmdbId],
      });
    },
  });
}
