import { api } from '@/lib/api';

export const tmdbService = {
  getTrending: async () => {
    const res = await api.get('/tmdb/trending');
    return res.data;
  },
  
  getTrendingTv: async (page: number | string = 1) => {
    const res = await api.get(`/tmdb/trending/tv?page=${page}`);
    return res.data;
  },

  getTrendingMovies: async (page: number | string = 1) => {
    const res = await api.get(`/tmdb/trending/movie?page=${page}`);
    return res.data;
  },

  discoverByNetwork: async (networkId: string, page: number | string = 1, filter: string = 'tv', region: string = 'US') => {
    const res = await api.get(`/tmdb/network/${networkId}?page=${page}&filter=${filter}&region=${region}`);
    return res.data;
  },

  discoverByGenre: async (genreName: string, queryParams: string) => {
    const res = await api.get(`/tmdb/discover/genre/${encodeURIComponent(genreName)}?${queryParams}`);
    return res.data;
  },

  discoverAdvanced: async (params: any, signal?: AbortSignal) => {
    const res = await api.get('/tmdb/discover/advanced', { params, signal });
    return res.data;
  },

  search: async (query: string, page: number | string = 1, signal?: AbortSignal) => {
    const res = await api.get(`/tmdb/search?q=${encodeURIComponent(query)}&page=${page}`, { signal });
    return res.data;
  },

  getGenreBackdrop: async (genreName: string) => {
    const res = await api.get(`/tmdb/discover/genre/${encodeURIComponent(genreName)}?type=movie`);
    return res.data;
  }
};
