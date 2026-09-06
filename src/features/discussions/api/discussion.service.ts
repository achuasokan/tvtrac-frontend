import { api } from '@/lib/api';
import {
  EpisodeSummary,
  MovieSummary,
  CommentsResponse,
  DiscussionComment,
  EmotionType,
  CreateCommentPayload,
  PendingMediaAttachment,
} from '../types/discussion.types';

export const discussionService = {
  getSummary: async (tmdbId: string, season: number, episode: number): Promise<EpisodeSummary> => {
    const res = await api.get(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/summary`);
    return res.data.data;
  },

  getMovieSummary: async (tmdbId: string): Promise<MovieSummary> => {
    const res = await api.get(`/discussions/movie/${tmdbId}/summary`);
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

  getMovieComments: async (
    tmdbId: string,
    params?: {
      sort?: 'top' | 'newest';
      cursor?: string;
      limit?: number;
      hideSpoilers?: boolean;
      reveal?: boolean;
    }
  ): Promise<CommentsResponse> => {
    const res = await api.get(`/discussions/movie/${tmdbId}/comments`, {
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
      platform?: string | null;
    }
  ) => {
    const res = await api.post(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/reaction`, body);
    return res.data.data;
  },

  upsertMovieReaction: async (
    tmdbId: string,
    body: {
      characterId?: number | null;
      rating?: number | null;
      platform?: string | null;
    }
  ) => {
    const res = await api.post(`/discussions/movie/${tmdbId}/reaction`, body);
    return res.data.data;
  },

  uploadMedia: async (file: File): Promise<PendingMediaAttachment> => {
    const formData = new FormData();
    formData.append('media', file);
    const res = await api.post('/discussions/upload-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  attachGif: async (providerId: string): Promise<PendingMediaAttachment> => {
    const res = await api.post('/discussions/attach-gif', { providerId });
    return res.data.data;
  },

  createComment: async (
    tmdbId: string,
    season: number,
    episode: number,
    body: CreateCommentPayload
  ): Promise<DiscussionComment> => {
    const res = await api.post(`/discussions/tv/${tmdbId}/season/${season}/episode/${episode}/comments`, body);
    return res.data.data;
  },

  createMovieComment: async (
    tmdbId: string,
    body: CreateCommentPayload
  ): Promise<DiscussionComment> => {
    const res = await api.post(`/discussions/movie/${tmdbId}/comments`, body);
    return res.data.data;
  },

  revealComment: async (commentId: string): Promise<Partial<DiscussionComment>> => {
    const res = await api.post(`/discussions/comments/${commentId}/reveal`);
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
