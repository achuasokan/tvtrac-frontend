"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { profileService } from "@/features/profile/api/profile.service";
import { setUser } from "@/store/slices/authSlice";
import { tmdbService } from "@/services/tmdb.service";

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

function Carousel({ title, children }: { title: React.ReactNode, children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const amount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: scrollLeft + (dir === 'left' ? -amount : amount),
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-4">
        {title}
        <div className="flex items-center bg-[#18181b] rounded-full border border-zinc-800/80 overflow-hidden shadow-sm">
          <button onClick={() => scroll('left')} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-px h-4 bg-zinc-700/50" />
          <button onClick={() => scroll('right')} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4"
      >
        {children}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const urlQuery = searchParams.get('q') || "";
  
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [inputValue, setInputValue] = useState(urlQuery);
  const [results, setResults] = useState<TmdbItem[]>([]);
  const [trendingCache, setTrendingCache] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [genreImages, setGenreImages] = useState<Record<string, string>>({});
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const platformsRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (platformsRef.current) {
      platformsRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (platformsRef.current) {
      platformsRef.current.scrollBy({ left: 300, behavior: "smooth" });
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

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  // Keep inputValue in sync if URL changes externally (e.g. Back button)
  useEffect(() => {
    setInputValue(urlQuery);
  }, [urlQuery]);

  // Debounce input value to URL
  useEffect(() => {
    if (inputValue.trim() === "") {
      router.replace(pathname, { scroll: false });
      return;
    }

    const timer = setTimeout(() => {
      router.replace(`${pathname}?q=${encodeURIComponent(inputValue)}`, { scroll: false });
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, pathname, router]);

  // Fetch data based on URL query
  useEffect(() => {
    const controller = new AbortController();
    
    if (urlQuery.trim()) {
      const fetchSearch = async () => {
        try {
          setIsLoading(true);
          const data = await tmdbService.search(urlQuery, 1, controller.signal);
          const filtered = data.results?.filter((item: any) => item.media_type !== "person" && item.poster_path) || [];
          setResults(filtered);
          setHasMore(data.page < data.total_pages);
          setPage(1);
        } catch (error: any) {
          if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
            console.error("Failed to search:", error);
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchSearch();
    } else {
      const fetchTrending = async () => {
        if (trendingCache.length > 0) {
          setResults(trendingCache);
          setHasMore(false);
          return;
        }

        try {
          setIsLoading(true);
          setResults([]);
          const [tvData, movieData] = await Promise.all([
            tmdbService.getTrendingTv().catch(() => ({ results: [] })),
            tmdbService.getTrendingMovies().catch(() => ({ results: [] }))
          ]);
          
          const tvShows = tvData.results?.filter((item: any) => item.poster_path).map((item: any) => ({ ...item, media_type: 'tv' })) || [];
          const movies = movieData.results?.filter((item: any) => item.poster_path).map((item: any) => ({ ...item, media_type: 'movie' })) || [];
          
          const combined = [...tvShows, ...movies];
          setTrendingCache(combined);
          setResults(combined);
          setHasMore(false);
        } catch (error) {
          console.error("Failed to fetch trending:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTrending();
    }
    
    return () => controller.abort();
  }, [urlQuery]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const data = await tmdbService.search(urlQuery, nextPage);
      const filtered = data.results?.filter((item: any) => item.media_type !== "person" && item.poster_path) || [];
      setResults(prev => [...prev, ...filtered]);
      setHasMore(data.page < data.total_pages);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Fetch backdrop images for both genres and studios
  const genreNames = [
    "K-Drama", "Action", "Comedy", "Sci-Fi", "Horror", 
    "Romance", "Drama", "Animation", "Documentary",
    "Kids", "Mystery", "News", "Reality", 
    "Sci-Fi & Fantasy", "Soap", "Talk", "War & Politics", "Western"
  ];
  const studioNames = ["Marvel", "DC", "Disney", "Pixar", "A24", "HBO", "Universal", "WB", "Star Wars", "James Bond"];
  const allCategories = [...genreNames, ...studioNames];
  
  useEffect(() => {
    const fetchImages = async () => {
      const images: Record<string, string> = {};
      await Promise.all(
        allCategories.map(async (name) => {
          try {
            const data = await tmdbService.getGenreBackdrop(name);
            const firstWithBackdrop = data.results?.find((item: any) => item.backdrop_path);
            if (firstWithBackdrop) {
              images[name] = `https://image.tmdb.org/t/p/w780${firstWithBackdrop.backdrop_path}`;
            }
          } catch {}
        })
      );
      setGenreImages(images);
    };
    fetchImages();
  }, []);

  const renderItemCard = (item: TmdbItem) => (
    <div key={item.id} className="group cursor-pointer flex flex-col gap-2" onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}>
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
        <img 
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
          alt={item.title || item.name} 
          className="w-full h-full object-cover"
        />
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 z-10">
          {item.vote_average ? (
            <div className="bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
            </div>
          ) : null}
        </div>

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

      {/* Title */}
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
          {item.title || item.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          {urlQuery.trim() && (
            <>
              <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
            </>
          )}
          <span className="text-[10px] text-zinc-500 font-medium">
            {item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : '')}
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
      
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent pt-4 sm:pt-8 pb-4 sm:pb-6 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto relative flex items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search TV shows and movies..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 text-white rounded-2xl py-3 sm:py-4 pl-11 sm:pl-14 pr-[80px] sm:pr-[100px] focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all text-sm sm:text-lg placeholder:text-zinc-500 shadow-xl backdrop-blur-md"
            />
            
            <div className="absolute inset-y-0 right-1.5 sm:right-2 flex items-center gap-0.5 sm:gap-1">
              {inputValue.length > 0 && (
                <button 
                  onClick={() => setInputValue("")}
                  className="p-1.5 sm:p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <div className="w-px h-5 sm:h-6 bg-zinc-700/50 mx-0.5 sm:mx-1"></div>
              
              <button 
                onClick={() => router.push("/discover/filter")}
                className="cursor-pointer p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors mr-0.5 sm:mr-1"
                title="Advanced Filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="w-full max-w-5xl mx-auto px-4 mt-2">
        
        {/* Platforms Section */}
        {!urlQuery.trim() && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Browse by Platform
              </h3>
              
              {/* Scroll Controls Pill */}
              <div className="flex items-center bg-[#18181b] rounded-full border border-zinc-800/80 overflow-hidden shadow-sm">
                <button onClick={scrollLeft} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-px h-4 bg-zinc-700/50" />
                <button onClick={scrollRight} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div 
              ref={platformsRef} 
              className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {[
                { id: 8, name: "Netflix", logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg" },
                { id: 9, name: "Prime Video", logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg" },
                { id: 350, name: "Apple TV+", logoPath: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg" },
                { id: 337, name: "Disney+", logoPath: "/97yvRBw1GzX7fXprcF80er19ot.jpg" },
                { id: 15, name: "Hulu", logoPath: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg" },
                { id: 526, name: "AMC+", logoPath: "/ovmu6uot1XVvsemM2dDySXLiX57.jpg" },
                { id: 34, name: "MGM+", logoPath: "/ctiRpS16dlaTXQBSsiFncMrgWmh.jpg" },
                { id: 37, name: "Showtime", logoPath: "/h0ZYcYHicKQ4Ixm5nOjqvwni5NG.jpg" },
                { id: 1899, name: "Max", logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg" },
                { id: 386, name: "Peacock", logoPath: "/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg" },
                { id: 531, name: "Paramount+", logoPath: "/h5DcR0J2EESLitnhR8xLG1QymTE.jpg" },
                { id: 283, name: "Crunchyroll", logoPath: "/fzN5Jok5Ig1eJ7gyNGoMhnLSCfh.jpg" },
                { id: 122, name: "Hotstar", logoPath: "/kVqjgpcwvDJOhCupjcLzwwtOp52.jpg" }, 
                { id: 43, name: "Starz", logoPath: "/yIKwylTLP1u8gl84Is7FItpYLGL.jpg" },
                { id: 510, name: "Discovery+", logoPath: "/eMTnWwNVtThkjvQA6zwxaoJG9NE.jpg" },
                { id: 99, name: "Shudder", logoPath: "/vEtdiYRPRbDCp1Tcn3BEPF1Ni76.jpg" },
                { id: 11, name: "MUBI", logoPath: "/x570VpH2C9EKDf1riP83rYc5dnL.jpg" },
                { id: 300, name: "Pluto TV", logoPath: "/dB8G41Q6tSL5NBisrIeqByfepBc.jpg" },
                { id: 344, name: "Rakuten Viki", logoPath: "/73uV3YooOA8gD9YQTXFj2XakZWA.jpg" },
              ].map(platform => (
                <button 
                  key={platform.id}
                  onClick={() => router.push(`/discover/network/${platform.id}?name=${encodeURIComponent(platform.name)}`)}
                  className="flex-shrink-0 relative w-24 h-24 rounded-full overflow-hidden group hover:scale-105 transition-transform duration-300 border border-zinc-800/80 shadow-lg cursor-pointer bg-zinc-900"
                >
                  {/* Ambient Blurred Background (using the logo itself) */}
                  <img 
                    src={`https://image.tmdb.org/t/p/w200${platform.logoPath}`}
                    className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-300 scale-150 bg-black" 
                    alt="" 
                  />
                  
                  {/* Dark Overlay for contrast */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-300 rounded-full" />
                  
                  {/* Foreground Circular Logo */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <img 
                      src={`https://image.tmdb.org/t/p/w200${platform.logoPath}`}
                      className="w-14 h-14 rounded-full shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-300 object-cover bg-black" 
                      alt={platform.name} 
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {urlQuery.trim() ? "Search Results" : "Trending Now"}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="relative aspect-[2/3] w-full rounded-xl bg-zinc-800 shadow-lg" />
                <div>
                  <div className="h-4 bg-zinc-800 rounded w-3/4 mb-1.5 mt-1"></div>
                  <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-zinc-500">We couldn't find anything matching "{urlQuery}".</p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {urlQuery.trim() ? (
              // Unified Search Grid
              <div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                  {results.map(renderItemCard)}
                  
                  {/* Inline Load More Card */}
                  {hasMore && (
                    <div 
                      onClick={handleLoadMore}
                      className={`group cursor-pointer flex flex-col items-center justify-center gap-3 aspect-[2/3] w-full rounded-xl bg-zinc-900 border border-zinc-800/50 shadow-lg hover:bg-zinc-800 hover:border-zinc-500 transition-all duration-300 ${isLoadingMore ? 'pointer-events-none opacity-80' : ''}`}
                    >
                      {isLoadingMore ? (
                        <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">Load More</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Dashboard View (Trending)
              <>
                {/* TV Shows Section */}
                {results.filter(item => item.media_type === "tv").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        TV Shows
                      </h3>
                      <button onClick={() => router.push('/discover/tv')} className="cursor-pointer text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                        See All <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {results.filter(item => item.media_type === "tv").slice(0, 6).map(renderItemCard)}
                    </div>
                  </div>
                )}

                {/* Movies Section */}
                {results.filter(item => item.media_type === "movie").length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-zinc-300 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        Movies
                      </h3>
                      <button onClick={() => router.push('/discover/movies')} className="cursor-pointer text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                        See All <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                      {results.filter(item => item.media_type === "movie").slice(0, 6).map(renderItemCard)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Explore by Genre Section */}
            {!urlQuery.trim() && (
              <div className="mt-10 mb-10 space-y-10">
                
                {/* Genres */}
                <Carousel 
                  title={
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Explore by Genre
                    </h3>
                  }
                >
                  {genreNames.map(name => (
                    <button 
                      key={name}
                      onClick={() => router.push(`/discover/genre/${encodeURIComponent(name)}`)}
                      className="cursor-pointer flex-shrink-0 snap-start w-32 sm:w-40 group relative h-16 sm:h-20 rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center shadow hover:shadow-xl transition-all duration-300 border border-zinc-800/80 hover:border-zinc-500"
                    >
                      {genreImages[name] && (
                        <img 
                          src={genreImages[name]} 
                          alt={name}
                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                      <span className="relative z-10 font-bold text-[13px] sm:text-sm tracking-wide text-zinc-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:-translate-y-0.5 transition-transform duration-300">
                        {name}
                      </span>
                    </button>
                  ))}
                </Carousel>

                {/* Studios / Universes */}
                <Carousel
                  title={
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Explore by Universe & Studio
                    </h3>
                  }
                >
                  {studioNames.map(name => (
                    <button 
                      key={name}
                      onClick={() => router.push(`/discover/genre/${encodeURIComponent(name)}`)}
                      className="cursor-pointer flex-shrink-0 snap-start w-32 sm:w-40 group relative h-16 sm:h-20 rounded-2xl bg-zinc-900 overflow-hidden flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 border border-zinc-800/80 hover:border-zinc-400"
                    >
                      {genreImages[name] && (
                        <img 
                          src={genreImages[name]} 
                          alt={name}
                          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-300" />
                      <span className="relative z-10 font-black text-[13px] sm:text-[15px] tracking-wide uppercase text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-300">
                        {name}
                      </span>
                    </button>
                  ))}
                </Carousel>

              </div>
            )}
          </div>
        )}
      </div>

    </main>
  );
}
