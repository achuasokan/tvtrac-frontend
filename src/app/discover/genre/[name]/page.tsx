"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { tmdbService } from "@/services/tmdb.service";
import { useToggleWatchlist } from "@/hooks/useToggleWatchlist";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { motion } from "framer-motion";
import { useInfiniteQuery } from "@tanstack/react-query";

// Global cache for genre discovery results
const genreResultsCache = new Map<string, TmdbItem[]>();

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

const SORT_OPTIONS = [
  { id: "popularity.desc", label: "Popular" },
  { id: "vote_average.desc", label: "Top Rated" },
  { id: "primary_release_date.desc", label: "Newest" },
  { id: "primary_release_date.asc", label: "Oldest" },
];

const LANGUAGES = [
  { code: "", label: "All" },
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
];

const RATING_OPTIONS = [
  { value: "", label: "Any" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "", label: "All Years" },
  ...Array.from({ length: currentYear - 1969 }, (_, i) => {
    const year = currentYear - i;
    return { value: String(year), label: String(year) };
  }),
];

// Custom dropdown component with cinema ticket-cut geometry and neon teal highlights
function PillDropdown({ 
  label, 
  value, 
  options, 
  onChange, 
  icon 
}: { 
  label: string; 
  value: string; 
  options: { value: string; label: string }[]; 
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const isActive = value !== "";
  const displayLabel = options.find(o => o.value === value)?.label || label;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 130;
      let left = rect.left;
      // Keep menu within viewport
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (left < 8) left = 8;
      setMenuPos({ top: rect.bottom + 6, left });
    }
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`group flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-xs font-semibold transition-all border whitespace-nowrap active:scale-95 outline-none focus:outline-none focus:ring-0 cursor-pointer ${
          isActive
            ? "bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/60 shadow-[0_0_15px_rgba(45,212,191,0.2)] font-bold ring-1 ring-[#2dd4bf]/25"
            : "bg-zinc-900/80 text-zinc-400 border-zinc-800/90 hover:text-white hover:bg-zinc-850 hover:border-zinc-700"
        }`}
      >
        <span className={isActive ? "text-[#2dd4bf]" : "text-zinc-500 group-hover:text-zinc-300"}>
          {icon}
        </span>
        <span>{isActive ? displayLabel : label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180 text-[#2dd4bf]" : "text-zinc-500 group-hover:text-zinc-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop to close on tap (mobile-friendly) */}
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div 
            ref={menuRef}
            className="fixed w-[130px] max-h-56 overflow-y-auto bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm shadow-[0_10px_35px_rgba(0,0,0,0.85)] py-1 z-[9999] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {options.map(opt => (
              <button
                type="button"
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  value === opt.value
                    ? "bg-[#2dd4bf]/15 text-[#2dd4bf] font-bold"
                    : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function DiscoverGenrePage() {
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const genreName = decodeURIComponent(params.name as string);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const toggleWatchlistMutation = useToggleWatchlist();
  const dispatch = useDispatch();
  
  // Initialize state from URL params if they exist
  const [filter, setFilter] = useState<"tv" | "movie">((searchParams.get("type") as "tv" | "movie") || "movie");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "popularity.desc");
  const [minRating, setMinRating] = useState(searchParams.get("min_rating") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [language, setLanguage] = useState(searchParams.get("language") || "");

  const hasActiveFilters = minRating !== "" || year !== "" || language !== "";

  // Sync state changes to URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (filter !== "movie") newParams.set("type", filter); else newParams.delete("type");
    if (sortBy !== "popularity.desc") newParams.set("sort_by", sortBy); else newParams.delete("sort_by");
    if (minRating) newParams.set("min_rating", minRating); else newParams.delete("min_rating");
    if (year) newParams.set("year", year); else newParams.delete("year");
    if (language) newParams.set("language", language); else newParams.delete("language");

    const newUrl = `${pathname}?${newParams.toString()}`;
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    
    // Only update if url actually changed
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filter, sortBy, minRating, year, language, pathname, searchParams, router]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const buildQueryParams = (pageNumber: number, currentFilter: string) => {
    const params = new URLSearchParams();
    params.set("page", String(pageNumber));
    params.set("type", currentFilter);
    params.set("sort_by", sortBy);
    if (minRating) params.set("min_rating", minRating);
    if (year) {
      params.set("year_from", year);
      params.set("year_to", year);
    }
    if (language) params.set("language", language);
    return params.toString();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage: hasMore,
    isFetchingNextPage: loadingMore,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['genre-results', genreName, filter, sortBy, minRating, year, language],
    queryFn: async ({ pageParam = 1 }) => {
      const queryString = buildQueryParams(pageParam, filter);
      const response = await tmdbService.discoverByGenre(genreName, queryString);
      const newResults = response.results?.filter((item: any) => item.poster_path) || [];
      const formattedResults = newResults.map((item: any) => ({ 
        ...item, 
        media_type: filter 
      }));

      return {
        results: formattedResults,
        nextPage: response.page < response.total_pages && pageParam < 100 ? response.page + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    initialPageParam: 1,
    enabled: !!genreName,
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  const clearFilters = () => {
    setSortBy("popularity.desc");
    setMinRating("");
    setYear("");
    setLanguage("");
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
          <span className="text-[10px] text-zinc-600 font-medium">
            {item.first_air_date ? item.first_air_date.split('-')[0] : (item.release_date ? item.release_date.split('-')[0] : '')}
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
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl pt-4 sm:pt-6 pb-3 sm:pb-4 px-3 sm:px-4 border-b border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
        {/* Ambient top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#2dd4bf]/25 to-transparent pointer-events-none" />

        {/* Top Row: Back + Title */}
        <div className="w-full max-w-5xl mx-auto flex items-center gap-2.5 sm:gap-3">
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
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {genreName}
            </h1>
          </div>
        </div>

        {/* Filter Section */}
        <div className="w-full max-w-5xl mx-auto mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-0.5">
          {/* Media Type Tabs - Fixed on mobile */}
          <div className="flex bg-zinc-950/90 p-1 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border border-zinc-800/90 shadow-inner backdrop-blur-md flex-shrink-0">
            {[
              { id: "movie", label: "Movies" },
              { id: "tv", label: "TV Shows" },
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
                  className={`cursor-pointer px-3.5 py-1.5 text-xs transition-colors duration-150 outline-none focus:outline-none focus:ring-0 ${
                    isActive 
                      ? "bg-zinc-850 text-white shadow-[0_0_12px_rgba(45,212,191,0.2)] border border-[#2dd4bf]/50 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-black" 
                      : "border border-transparent text-zinc-400 hover:text-zinc-200 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-semibold"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-zinc-800 flex-shrink-0 mx-1" />

          {/* Filter Pills - scrollable on mobile */}
          <div className="flex items-center gap-2 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4 sm:pr-0">
            {/* Sort Pill */}
            <PillDropdown
              label="Sort"
              value={sortBy === "popularity.desc" ? "" : sortBy}
              options={SORT_OPTIONS.map(o => ({ value: o.id === "popularity.desc" ? "" : o.id, label: o.label }))}
              onChange={(val) => setSortBy(val || "popularity.desc")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              }
            />

            {/* Year Pill */}
            <PillDropdown
              label="Year"
              value={year}
              options={YEAR_OPTIONS}
              onChange={setYear}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* Rating Pill */}
            <PillDropdown
              label="Rating"
              value={minRating}
              options={RATING_OPTIONS}
              onChange={setMinRating}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              }
            />

            {/* Language Pill */}
            {genreName !== "K-Drama" && (
              <PillDropdown
                label="Language"
                value={language}
                options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
                onChange={setLanguage}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                }
              />
            )}

            {/* Clear All */}
            {hasActiveFilters && (
              <>
                <div className="w-px h-4 bg-zinc-800 flex-shrink-0" />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.12)] active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-5">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-900 animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">No content found</h3>
            <p className="text-zinc-500 text-sm">Try adjusting your filters to find more results.</p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="mt-4 px-5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full text-xs font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            <InfiniteScroll hasMore={hasMore} isLoading={loadingMore} onLoadMore={handleLoadMore}>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 lg:gap-5">
                {results.map((item, idx) => renderItemCard(item, idx))}
              </div>
            </InfiniteScroll>
          </div>
        )}
      </div>

    </main>
  );
}
