"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

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

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const fetchNetworkShows = async (pageNumber: number, isInitial = false) => {
    if (!networkId) return;

    try {
      if (isInitial) setIsLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/tmdb/network/${networkId}?page=${pageNumber}`);
      const newResults = res.data.results?.filter((item: any) => item.poster_path) || [];
      
      const formattedResults = newResults.map((item: any) => ({ ...item, media_type: "tv" }));

      if (isInitial) {
        setResults(formattedResults);
      } else {
        setResults(prev => [...prev, ...formattedResults]);
      }

      setHasMore(res.data.page < res.data.total_pages && pageNumber < 100);
    } catch (error) {
      console.error("Failed to fetch network shows:", error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (networkId) {
      fetchNetworkShows(1, true);
    }
  }, [networkId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNetworkShows(nextPage);
    }
  };

  const renderItemCard = (item: TmdbItem) => (
    <div key={item.id} className="group cursor-pointer flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
        <img 
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
          alt={item.title || item.name} 
          className="w-full h-full object-cover"
        />
        {item.vote_average ? (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
          </div>
        ) : null}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center scale-75 group-hover:scale-100 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
          {item.title || item.name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">TV Show</span>
          <span className="text-[10px] text-zinc-600 font-medium">
            {item.first_air_date ? item.first_air_date.split('-')[0] : ''}
          </span>
        </div>
      </div>
    </div>
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
              {networkName} Originals
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Discover the most popular shows on {networkName}.</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="w-full max-w-5xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
             <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No shows found</h3>
            <p className="text-zinc-500">We couldn't find any shows for {networkName}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {results.map(renderItemCard)}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </main>
  );
}
