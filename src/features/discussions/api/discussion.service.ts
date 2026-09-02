import { api } from '@/lib/api';
import { EpisodeSummary, CommentsResponse, DiscussionComment, EmotionType } from '../types/discussion.types';

export const discussionService = {
  getSummary: async (tmdbId: string, season: number, episode: number): Promise<EpisodeSummary> => {
    const res = await api.get(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/summary`);
    return res.data.data;
  },

  getComments: async (
    tmdbId: string,
    season: number,
    episode: number,
    params?: {
      sort?: 'top' | 'newest';
      cursor?: string;
      limit?: number;
      hideSpoilers?: boolean;
      reveal?: boolean;
    }
  ): Promise<CommentsResponse> => {
    const res = await api.get(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/comments`, {
      params,
    });
    return res.data.data;
  },

  upsertReaction: async (
    tmdbId: string,
    season: number,
    episode: number,
    body: {
      emotion?: EmotionType | null;
      characterId?: number | null;
      rating?: number | null;
    }
  ) => {
    const res = await api.post(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/reaction`, body);
    return res.data.data;
  },

  createComment: async (
    tmdbId: string,
    season: number,
    episode: number,
    body: {
      content: string;
      isSpoiler: boolean;
    }
  ): Promise<DiscussionComment> => {
    const res = await api.post(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/comments`, body);
    return res.data.data;
  },

  deleteComment: async (commentId: string): Promise<boolean> => {
    const res = await api.delete(`/discussions/comments/${commentId}`);
    return res.data.success;
  },

  toggleLike: async (commentId: string): Promise<{ isLiked: boolean; likeCount: number }> => {
    const res = await api.post(`/discussions/comments/${commentId}/like`);
    return res.data.data;
  },
};
