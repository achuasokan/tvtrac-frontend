import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { discussionService } from './discussion.service';
import { CommentsResponse } from '../types/discussion.types';

interface ToggleLikeVariables {
  commentId: string;
  tmdbId: string;
  season: number;
  episode: number;
}

export function useToggleCommentLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: ToggleLikeVariables) => discussionService.toggleLike(commentId),
    onMutate: async ({ commentId, tmdbId, season, episode }) => {
      // Find all queries matching this episode's comments
      const queryFilter = {
        queryKey: ['episode-comments', tmdbId, season, episode],
      };

      await queryClient.cancelQueries(queryFilter);

      const previousQueries = queryClient.getQueriesData<InfiniteData<CommentsResponse>>(queryFilter);

      // Optimistically update all comment pages
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
        queryKey: ['episode-comments', variables.tmdbId, variables.season, variables.episode],
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
        queryKey: ['episode-comments', variables.tmdbId, variables.season, variables.episode],
      });
    },
  });
}
