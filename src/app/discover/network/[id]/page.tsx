"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { tmdbService } from "@/services/tmdb.service";
import { useToggleWatchlist } from "@/hooks/useToggleWatchlist";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { motion } from "framer-motion";
import { useInfiniteQuery } from "@tanstack/react-query";

// Global cache for network/platform discovery results
const networkResultsCache = new Map<string, TmdbItem[]>();

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export default function DiscoverNetworkPage() {
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const networkId = params.id as string;
  const networkName = searchParams.get("name") || "Network";

  const [filter, setFilter] = useState<"tv" | "movies" | "animation" | "anime">("tv");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const toggleWatchlistMutation = useToggleWatchlist();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const {
    data,
    fetchNextPage,
    hasNextPage: hasMore,
    isFetchingNextPage: loadingMore,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['network-results', networkId, filter],
    queryFn: async ({ pageParam = 1 }) => {
      const indianProviders = ["122", "220", "237", "232", "119"];
      const region = indianProviders.includes(networkId) ? "IN" : "US";

      const response = await tmdbService.discoverByNetwork(networkId, pageParam, filter, region);
      const newResults = response.results?.filter((item: any) => item.poster_path) || [];
      const formattedResults = newResults.map((item: any) => ({ 
        ...item, 
        media_type: filter === "movies" ? "movie" : "tv" 
      }));

      return {
        results: formattedResults,
        nextPage: response.page < response.total_pages && pageParam < 100 ? response.page + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    initialPageParam: 1,
    enabled: !!networkId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const results = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page?.results || []) || [];
    const seen = new Set<string>();
    return raw.filter((item: TmdbItem) => {
      const key = `${item?.media_type || 'item'}-${item?.id}`;
      if (!item?.id || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  };

  const handleToggleWatchlist = async (e: React.MouseEvent, item: TmdbItem) => {
    e.stopPropagation();
    if (!user) return router.push("/login");
    
    const isShow = item.media_type === 'tv';
    const watchlist = isShow ? user.watchlistShows || [] : user.watchlistMovies || [];
    const isAdded = watchlist.includes(item.id.toString());
    
    setTogglingId(item.id);
    try {
      await toggleWatchlistMutation.mutateAsync({
        tmdbId: item.id,
        mediaType: isShow ? 'tv' : 'movie',
        isAdded
      });
    } catch (error) {
      console.error("Failed to toggle watchlist", error);
    } finally {
      setTogglingId(null);
    }
  };

  const renderItemCard = (item: TmdbItem, idx: number = 0) => (
    <motion.div 
      key={`${item.media_type || 'item'}-${item.id}-${idx}`} 
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min((idx % 12) * 0.03, 0.35),
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      className="group cursor-pointer flex flex-col gap-2" 
      onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
        <img 
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
          alt={item.title || item.name} 
          className="w-full h-full object-cover animate-in fade-in duration-300"
        />
        {item.vote_average ? (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
          </div>
        ) : null}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Add Button - Always visible on mobile, hover-only on desktop */}
        {(() => {
          const isShow = item.media_type === 'tv';
          const watchlist = isShow ? user?.watchlistShows || [] : user?.watchlistMovies || [];
          const isAdded = watchlist.includes(item.id.toString());
          const isToggling = togglingId === item.id;
          
          return (
            <button 
              type="button"
              disabled={isToggling}
              onClick={(e) => handleToggleWatchlist(e, item)}
              className={`absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 z-20 shadow-lg md:opacity-0 md:scale-75 md:group-hover:opacity-100 md:group-hover:scale-100 ${
                isAdded 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-white/90 hover:bg-white text-black'
              }`}
              title={isAdded ? "Remove from Watchlist" : "Add to Watchlist"}
            >
              {isToggling ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : isAdded ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          );
        })()}
      </div>
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
          {item.title || item.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">
            {item.media_type === "movie" ? "Movie" : "TV Show"}
          </span>
          <span className="text-[10px] text-zinc-600 font-medium">
            {(item.first_air_date || item.release_date) ? (item.first_air_date || item.release_date)!.split('-')[0] : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );

  if (isAuthLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative min-h-screen bg-[#050505] text-white pb-24 font-sans">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl pt-5 sm:pt-6 pb-3 sm:pb-4 px-4 border-b border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
        {/* Ambient top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#2dd4bf]/25 to-transparent pointer-events-none" />

        <div className="w-full max-w-5xl mx-auto flex items-center gap-3.5 sm:gap-4">
          <button 
            type="button"
            onClick={() => router.back()} 
            aria-label="Back"
            className="group w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm bg-zinc-900/90 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800/90 hover:border-[#2dd4bf]/50 hover:shadow-[0_0_15px_rgba(45,212,191,0.18)] active:scale-95 transition-all duration-200 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{networkName}</span>
              <span className="text-zinc-500 font-semibold text-base sm:text-lg">Catalog</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
              Discover the most popular content streaming on <span className="text-zinc-300 font-bold">{networkName}</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="w-full max-w-5xl mx-auto mt-4 sm:mt-5">
          <div className="flex overflow-x-auto gap-2 sm:gap-2.5 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { 
                id: "tv", 
                label: "TV Shows",
                icon: (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )
              },
              { 
                id: "movies", 
                label: "Movies",
                icon: (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                )
              },
              { 
                id: "animation", 
                label: "Animation",
                icon: (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                )
              },
              { 
                id: "anime", 
                label: "Anime",
                icon: (
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                )
              },
            ].map(f => {
              const isActive = filter === f.id;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => {
                    if (filter !== f.id) {
                      setFilter(f.id as any);
                    }
                  }}
                  className={`group inline-flex items-center gap-1.5 px-4 py-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 outline-none focus:outline-none focus:ring-0 cursor-pointer ${
                    isActive 
                      ? "bg-gradient-to-r from-[#2dd4bf] to-[#14b8a6] text-black shadow-[0_0_18px_rgba(45,212,191,0.35)] border border-[#2dd4bf] font-black" 
                      : "bg-zinc-900/80 border border-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 hover:shadow-[0_0_12px_rgba(45,212,191,0.1)]"
                  }`}
                >
                  <span className={`transition-colors ${isActive ? "text-black" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {f.icon}
                  </span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="w-full max-w-5xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-900 animate-pulse border border-zinc-800/50" />
            ))}
          </div>

        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
            <p className="text-zinc-500 mb-6">Failed to load content for {networkName}.</p>
            <button 
              onClick={() => fetchNextPage()}
              className="px-6 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-full font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No content found</h3>
            <p className="text-zinc-500">We couldn't find any content matching this filter for {networkName}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <InfiniteScroll hasMore={hasMore} isLoading={loadingMore} onLoadMore={handleLoadMore}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                {results.map((item, idx) => renderItemCard(item, idx))}
              </div>
            </InfiniteScroll>
          </div>
        )}
      </div>

    </main>
  );
}
