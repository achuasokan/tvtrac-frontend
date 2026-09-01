import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useWatchlistCategory(category: string, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ['watchlist', category],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get(`/users/watchlist/shows/categorized?category=${category}&page=${pageParam}&limit=${limit}`);
      return {
        data: res.data.data.data || [],
        hasMore: res.data.data.hasMore || false,
        nextPage: pageParam + 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPage : undefined,
    // Keep data fresh but don't refetch aggressively when switching tabs back and forth
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useToggleWatched() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ tmdbId, season, episode, runtime = 0 }: { tmdbId: string, season: number, episode: number, runtime?: number }) => {
            const res = await api.post('/tracking/watched/episode/toggle', { tmdbId, season, episode, runtime });
            return res.data;
        },
        onMutate: async ({ tmdbId, season, episode }) => {
            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['watchlist'] });
            
            // Snapshot previous value
            const previousWatchlistCache = queryClient.getQueriesData({ queryKey: ['watchlist'] });
            
            // Optimistically update: find the item in all active watchlist infinite queries and mark it
            queryClient.setQueriesData({ queryKey: ['watchlist'] }, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        data: page.data.map((item: any) => {
                            if (item.tmdbId === tmdbId && item.nextSeason === season && item.nextEpisode === episode) {
                                // Optimistically mark this specific item (UI only)
                                // We don't remove it from the list because we don't know the new order/next episode
                                return { ...item, _optimisticWatched: true };
                            }
                            return item;
                        })
                    }))
                };
            });
            
            return { previousWatchlistCache };
        },
        onError: (err, variables, context) => {
            // Rollback to snapshot if mutation fails
            if (context?.previousWatchlistCache) {
                context.previousWatchlistCache.forEach(([queryKey, oldData]) => {
                    queryClient.setQueryData(queryKey, oldData);
                });
            }
        },
        onSettled: () => {
            // Safe authoritative invalidation (React Query v5 natively handles refetching loaded pages)
            // Active queries will refetch immediately. Inactive queries will be marked stale.
            queryClient.invalidateQueries({ queryKey: ['watchlist'] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'history'] });
            queryClient.invalidateQueries({ queryKey: ['profile', 'stats'] });
        }
    });
}
