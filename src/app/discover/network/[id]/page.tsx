"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { tmdbService } from "@/services/tmdb.service";
import { profileService } from "@/features/profile/api/profile.service";
import { setUser } from "@/store/slices/authSlice";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { motion } from "framer-motion";

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

  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<"tv" | "movies" | "animation" | "anime">("tv");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const fetchNetworkShows = async (pageNumber: number, currentFilter: string, isInitial = false, retryCount = 0) => {
    if (!networkId) return;

    try {
      if (isInitial && retryCount === 0) {
        setIsLoading(true);
        setErrorMsg(null);
      } else if (!isInitial && retryCount === 0) {
        setLoadingMore(true);
      }

      // Auto-detect Indian providers (Hotstar, JioCinema, SonyLIV, Zee5, Prime IN)
      const indianProviders = ["122", "220", "237", "232", "119"];
      const region = indianProviders.includes(networkId) ? "IN" : "US";

      const data = await tmdbService.discoverByNetwork(networkId, pageNumber, currentFilter, region);
      const newResults = data.results?.filter((item: any) => item.poster_path) || [];
      
      const formattedResults = newResults.map((item: any) => ({ 
        ...item, 
        media_type: currentFilter === "movies" ? "movie" : "tv" 
      }));

      if (isInitial) {
        setResults(formattedResults);
      } else {
        setResults(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = formattedResults.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(data.page < data.total_pages && pageNumber < 100);
      
      if (isInitial) setIsLoading(false);
      else setLoadingMore(false);
      
    } catch (error) {
      console.error(`Failed to fetch network shows (Attempt ${retryCount + 1}):`, error);
      if (retryCount < 2) {
        setTimeout(() => fetchNetworkShows(pageNumber, currentFilter, isInitial, retryCount + 1), 1500);
      } else {
        if (isInitial) {
          setErrorMsg("Connection Failed. Please try again.");
          setIsLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    }
  };

  useEffect(() => {
    if (networkId) {
      fetchNetworkShows(1, filter, true);
    }
  }, [networkId, filter]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNetworkShows(nextPage, filter);
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
      const updatedUser = await profileService.toggleWatchlist(
        { type: isShow ? 'shows' : 'movies', tmdbId: item.id.toString() } as any,
        !isAdded
      );
      dispatch(setUser(updatedUser));
    } catch (error) {
      console.error("Failed to toggle watchlist", error);
    } finally {
      setTogglingId(null);
    }
  };

  const renderItemCard = (item: TmdbItem, idx: number = 0) => (
    <motion.div 
      key={item.id} 
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
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md pt-8 pb-4 px-4 border-b border-zinc-800">
        <div className="w-full max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {networkName} Catalog
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Discover the most popular content streaming on {networkName}.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="w-full max-w-5xl mx-auto mt-4">
          <div className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { id: "tv", label: "TV Shows" },
              { id: "movies", label: "Movies" },
              { id: "animation", label: "Animation" },
              { id: "anime", label: "Anime" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  if (filter !== f.id) {
                    setFilter(f.id as any);
                    setPage(1);
                    setResults([]);
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  filter === f.id 
                    ? "bg-white text-black" 
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
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
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
            <p className="text-zinc-500 mb-6">Failed to load content for {networkName}.</p>
            <button 
              onClick={() => fetchNetworkShows(1, filter, true)}
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
