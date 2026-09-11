"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter } from "next/navigation";
import { tmdbService } from "@/services/tmdb.service";
import { useToggleWatchlist } from "@/hooks/useToggleWatchlist";
import { setUser } from "@/store/slices/authSlice";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { motion } from "framer-motion";
import { useInfiniteQuery } from "@tanstack/react-query";

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
};

// Custom filter dropdown component with cinema ticket-cut geometry and neon teal highlights
function FilterDropdown({ 
  value, 
  options, 
  onChange, 
  icon,
  activeCondition
}: { 
  value: string; 
  options: { value: string; label: string }[]; 
  onChange: (val: string) => void;
  icon: React.ReactNode;
  activeCondition?: (val: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const isActive = activeCondition ? activeCondition(value) : Boolean(value && value !== "" && value !== "0");
  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.label || options[0]?.label || "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      // Do not close if the user is scrolling inside the dropdown menu itself
      if (menuRef.current && (e.target === menuRef.current || menuRef.current.contains(e.target as Node))) {
        return;
      }
      setOpen(false);
    };

    const handleResize = () => {
      setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = Math.max(rect.width, 160);
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (left < 8) left = 8;
      setMenuPos({ top: rect.bottom + 6, left, width: menuWidth });
    }
  }, [open]);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        title={displayLabel}
        className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-xs transition-all duration-200 border outline-none focus:outline-none focus:ring-0 cursor-pointer active:scale-[0.98] ${
          isActive
            ? "bg-zinc-900/90 border-[#2dd4bf]/70 shadow-[0_0_15px_rgba(45,212,191,0.2)] text-white ring-1 ring-[#2dd4bf]/30 font-bold"
            : "bg-zinc-950/70 border-zinc-800/90 text-zinc-400 hover:text-white hover:bg-zinc-900/70 hover:border-zinc-700 font-semibold"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className={`flex-shrink-0 transition-colors ${isActive ? "text-[#2dd4bf]" : "text-zinc-500 group-hover:text-zinc-300"}`}>
            {icon}
          </span>
          <span className="truncate">{displayLabel}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#2dd4bf]" : isActive ? "text-[#2dd4bf]" : "text-zinc-500 group-hover:text-zinc-300"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            className="fixed max-h-60 overflow-y-auto overscroll-contain bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm shadow-[0_12px_40px_rgba(0,0,0,0.9)] py-1 z-[9999] animate-in fade-in zoom-in-95 duration-150 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-700/90 hover:[&::-webkit-scrollbar-thumb]:bg-[#2dd4bf]/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-900/40"
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer truncate ${
                    isSelected
                      ? "bg-[#2dd4bf]/15 text-[#2dd4bf] font-bold"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white font-medium"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdvancedFilterPage() {
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // Filters State (initialized from URL if returning via back button)
  const getParam = (key: string, defaultValue: string = "") => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get(key) || defaultValue;
    }
    return defaultValue;
  };

  const [type, setType] = useState<"tv" | "movie">(getParam("type", "tv") as "tv" | "movie");
  const [year, setYear] = useState<string>(getParam("year"));
  const [genre, setGenre] = useState<string>(getParam("genre"));
  const [language, setLanguage] = useState<string>(getParam("language"));
  const [provider, setProvider] = useState<string>(getParam("provider"));
  const [status, setStatus] = useState<string>(getParam("status")); // Only for TV
  const [minRating, setMinRating] = useState<string>(getParam("minRating", "0")); // Default Any Rating
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
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
    hasNextPage,
    isFetchingNextPage: isFetchingMore,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['filter-results', type, year, genre, language, provider, status, minRating],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string> = {
        type,
        page: pageParam.toString(),
        sort_by: "popularity.desc"
      };
      
      if (minRating !== "0") {
        params["vote_average.gte"] = minRating;
        params["vote_count.gte"] = "10";
      }

      if (year) {
        if (type === "tv") params["first_air_date_year"] = year;
        else params["primary_release_year"] = year;
      }
      if (genre) params["with_genres"] = genre;
      if (language) params["with_original_language"] = language;
      if (provider) {
        params["with_watch_providers"] = provider;
        
        // Auto-switch to India region for Indian platforms or languages, otherwise default to US
        const indianProviders = ["122", "220", "232", "237", "309"];
        const indianLangs = ["hi", "ml", "ta", "te", "bn", "kn"];
        
        if (indianProviders.includes(provider) || indianLangs.includes(language)) {
          params["watch_region"] = "IN";
        } else {
          params["watch_region"] = "US";
        }
      }
      if (type === "tv" && status) params["with_status"] = status;

      const response = await tmdbService.discoverAdvanced(params);
      const filtered = response.results?.filter((item: any) => item.poster_path) || [];
      const mapped = filtered.map((item: any) => ({ ...item, media_type: type }));
      
      return {
        results: mapped,
        nextPage: response.page < response.total_pages ? response.page + 1 : undefined,
        totalResults: response.total_results || 0,
        totalPages: response.total_pages || 1,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    initialPageParam: 1,
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
  const totalResults = data?.pages[0]?.totalResults || null;
  const totalPages = data?.pages[0]?.totalPages || 1;
  const errorMsg = isError ? "TMDB servers are currently overloaded. Please try again in a moment." : null;

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

  // Sync filters to URL without reloading page
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams();
    if (type !== "tv") params.set("type", type);
    if (year) params.set("year", year);
    if (genre) params.set("genre", genre);
    if (language) params.set("language", language);
    if (provider) params.set("provider", provider);
    if (status && type === "tv") params.set("status", status);
    if (minRating !== "0") params.set("minRating", minRating);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    if (window.location.search !== queryString) {
      window.history.replaceState(null, "", `${window.location.pathname}${queryString}`);
    }
  }, [type, year, genre, language, provider, status, minRating]);

  // Dropdown Options
  const years = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);
  const platforms = [
    { id: "8", name: "Netflix" },
    { id: "9", name: "Amazon Prime" },
    { id: "122", name: "Hotstar" },
    { id: "119", name: "Amazon Video" },
    { id: "350", name: "Apple TV+" },
    { id: "337", name: "Disney+" },
    { id: "1899", name: "Max" },
    { id: "15", name: "Hulu" },
    { id: "386", name: "Peacock" },
    { id: "531", name: "Paramount+" },
    { id: "283", name: "Crunchyroll" },
    { id: "220", name: "JioCinema" },
    { id: "232", name: "ZEE5" },
    { id: "237", name: "Sony Liv" },
    { id: "309", name: "Sun Nxt" }
  ];
  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "ml", name: "Malayalam" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "ko", name: "Korean" },
    { code: "ja", name: "Japanese" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "it", name: "Italian" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" }
  ];
  const tvStatuses = [
    { id: "0", name: "Returning Series" },
    { id: "1", name: "Planned" },
    { id: "2", name: "In Production" },
    { id: "3", name: "Ended" },
    { id: "4", name: "Canceled" },
    { id: "5", name: "Pilot" }
  ];
  
  // Genres change based on type
  const genres = type === "tv" ? [
    { id: "10759", name: "Action & Adventure" },
    { id: "16", name: "Animation" },
    { id: "35", name: "Comedy" },
    { id: "80", name: "Crime" },
    { id: "99", name: "Documentary" },
    { id: "18", name: "Drama" },
    { id: "10751", name: "Family" },
    { id: "10762", name: "Kids" },
    { id: "9648", name: "Mystery" },
    { id: "10764", name: "Reality" },
    { id: "10765", name: "Sci-Fi & Fantasy" },
    { id: "10767", name: "Talk" },
    { id: "10768", name: "War & Politics" },
    { id: "37", name: "Western" }
  ] : [
    { id: "28", name: "Action" },
    { id: "12", name: "Adventure" },
    { id: "16", name: "Animation" },
    { id: "35", name: "Comedy" },
    { id: "80", name: "Crime" },
    { id: "99", name: "Documentary" },
    { id: "18", name: "Drama" },
    { id: "10751", name: "Family" },
    { id: "14", name: "Fantasy" },
    { id: "36", name: "History" },
    { id: "27", name: "Horror" },
    { id: "10402", name: "Music" },
    { id: "9648", name: "Mystery" },
    { id: "10749", name: "Romance" },
    { id: "878", name: "Science Fiction" },
    { id: "10770", name: "TV Movie" },
    { id: "53", name: "Thriller" },
    { id: "10752", name: "War" },
    { id: "37", name: "Western" }
  ];

  const platformOptions = useMemo(() => [
    { value: "", label: "Any Platform" },
    ...platforms.map(p => ({ value: p.id, label: p.name }))
  ], [platforms]);

  const languageOptions = useMemo(() => [
    { value: "", label: "Any Language" },
    ...languages.map(l => ({ value: l.code, label: l.name }))
  ], [languages]);

  const genreOptions = useMemo(() => [
    { value: "", label: "Any Genre" },
    ...genres.map(g => ({ value: g.id, label: g.name }))
  ], [genres]);

  const yearOptions = useMemo(() => [
    { value: "", label: "Any Year" },
    ...years.map(y => ({ value: y.toString(), label: y.toString() }))
  ], [years]);

  const statusOptions = useMemo(() => [
    { value: "", label: "Any Status" },
    ...tvStatuses.map(s => ({ value: s.id, label: s.name }))
  ], [tvStatuses]);

  const ratingOptions = useMemo(() => [
    { value: "0", label: "Any Rating" },
    { value: "5", label: "5+ Stars" },
    { value: "6", label: "6+ Stars" },
    { value: "7", label: "7+ Stars" },
    { value: "8", label: "8+ Stars" },
    { value: "9", label: "9+ Stars" }
  ], []);

  if (isAuthLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
      </div>
    );
  }

  const activeFilterCount = [year, genre, language, provider, status, minRating !== "0" ? minRating : ""].filter(Boolean).length;

  return (
    <main className="flex-1 flex flex-col relative min-h-screen bg-[#050505] text-white font-sans pb-24">
      {/* Header & Collapsible Filters */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
        {/* Ambient top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#2dd4bf]/25 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Title & Back Button */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button 
                onClick={() => router.push("/discover")} 
                aria-label="Back to Discover"
                className="group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm bg-zinc-900/90 border border-zinc-800/90 text-zinc-400 hover:text-white hover:border-[#2dd4bf]/50 hover:bg-zinc-850 hover:shadow-[0_0_15px_rgba(45,212,191,0.18)] active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2.5 sm:gap-3">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Filter
                </h1>
                {totalResults !== null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] sm:text-xs text-zinc-400 font-medium shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
                    {totalResults.toLocaleString()} results
                  </span>
                )}
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
              
              {/* Type Toggle */}
              <div className="flex bg-zinc-950/90 p-1 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border border-zinc-800/90 shadow-inner backdrop-blur-md">
                <button 
                  type="button"
                  className={`cursor-pointer px-3.5 py-1.5 sm:px-4 sm:py-1.5 text-xs font-bold transition-colors duration-150 outline-none focus:outline-none focus:ring-0 ${
                    type === 'tv' 
                      ? 'bg-zinc-850 text-white shadow-[0_0_12px_rgba(45,212,191,0.2)] border border-[#2dd4bf]/50 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-black' 
                      : 'border border-transparent text-zinc-400 hover:text-zinc-200 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-semibold'
                  }`}
                  onClick={() => { setType('tv'); setGenre(''); setStatus(''); }}
                >
                  TV Shows
                </button>
                <button 
                  type="button"
                  className={`cursor-pointer px-3.5 py-1.5 sm:px-4 sm:py-1.5 text-xs font-bold transition-colors duration-150 outline-none focus:outline-none focus:ring-0 ${
                    type === 'movie' 
                      ? 'bg-zinc-850 text-white shadow-[0_0_12px_rgba(45,212,191,0.2)] border border-[#2dd4bf]/50 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-black' 
                      : 'border border-transparent text-zinc-400 hover:text-zinc-200 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-semibold'
                  }`}
                  onClick={() => { setType('movie'); setGenre(''); setStatus(''); }}
                >
                  Movies
                </button>
              </div>

              {/* Filters Toggle Button */}
              <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`cursor-pointer flex items-center gap-2 text-xs font-black px-3.5 py-2 sm:px-4 sm:py-2 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm transition-all duration-200 active:scale-95 outline-none focus:outline-none focus:ring-0 ${
                  showFilters || activeFilterCount > 0 
                    ? 'bg-gradient-to-r from-[#2dd4bf] to-[#14b8a6] text-black shadow-[0_0_20px_rgba(45,212,191,0.35)] border border-[#2dd4bf]' 
                    : 'bg-zinc-900/90 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#2dd4bf]/40 hover:shadow-[0_0_15px_rgba(45,212,191,0.12)]'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                    showFilters || activeFilterCount > 0 ? 'bg-black text-[#2dd4bf]' : 'bg-[#2dd4bf] text-black'
                  }`}>
                    {activeFilterCount}
                  </span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Collapsible Filter Grid */}
          {showFilters && (
            <div className="pt-3.5 border-t border-zinc-800/60 mt-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className={`grid grid-cols-2 sm:grid-cols-3 ${type === 'tv' ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-2.5 sm:gap-3`}>
                
                {/* Platform Filter */}
                <FilterDropdown
                  value={provider}
                  onChange={setProvider}
                  options={platformOptions}
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />

                {/* Language Filter */}
                <FilterDropdown
                  value={language}
                  onChange={setLanguage}
                  options={languageOptions}
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  }
                />

                {/* Genre Filter */}
                <FilterDropdown
                  value={genre}
                  onChange={setGenre}
                  options={genreOptions}
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  }
                />

                {/* Year Filter */}
                <FilterDropdown
                  value={year}
                  onChange={setYear}
                  options={yearOptions}
                  icon={
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />

                {/* Status Filter (TV only) */}
                {type === "tv" && (
                  <FilterDropdown
                    value={status}
                    onChange={setStatus}
                    options={statusOptions}
                    icon={
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                )}

                {/* Rating Filter */}
                <FilterDropdown
                  value={minRating}
                  onChange={setMinRating}
                  options={ratingOptions}
                  activeCondition={(val) => val !== "0" && val !== ""}
                  icon={
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  }
                />

                {/* Active Filters Summary & Clear All */}
                {activeFilterCount > 0 && (
                  <div className={`col-span-2 sm:col-span-3 ${type === 'tv' ? 'lg:col-span-6' : 'lg:col-span-5'} flex items-center justify-between pt-2.5 border-t border-zinc-800/60 mt-1`}>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-[#2dd4bf] shadow-[0_0_8px_#2dd4bf]" />
                      <span>
                        <strong className="text-white font-bold">{activeFilterCount}</strong> active {activeFilterCount === 1 ? 'filter' : 'filters'} applied
                      </span>
                    </div>
                    <button 
                      onClick={() => { setYear(''); setGenre(''); setLanguage(''); setProvider(''); setStatus(''); setMinRating('0'); }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 py-1.5 px-3 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.12)] active:scale-95 transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {isLoading && results.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
            {[...Array(14)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-900 rounded-xl animate-pulse border border-zinc-800/50" />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="text-center py-20 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
            <p className="text-zinc-400 mb-6">{errorMsg}</p>
            <button 
              onClick={() => refetch()}
              className="bg-white text-black font-bold py-2 px-6 rounded-md hover:bg-zinc-200 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="pb-10">
            <InfiniteScroll hasMore={!!hasNextPage} isLoading={isFetchingMore} onLoadMore={() => fetchNextPage()}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mb-8">
                {results.map((item, idx) => (
                  <motion.div 
                    key={`${item.id}-${idx}`} 
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min((idx % 14) * 0.03, 0.35),
                      ease: [0.21, 0.47, 0.32, 0.98]
                    }}
                    className="group cursor-pointer flex flex-col gap-2" 
                    onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
                  >
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
                      <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover animate-in fade-in duration-300" />
                      
                      {item.vote_average ? (
                        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1 z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-[9px] sm:text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
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
                      <h3 className="text-[11px] sm:text-xs font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{item.title || item.name}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                        <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                          {item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : '')}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </InfiniteScroll>
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-zinc-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-400">No results found</h3>
            <p className="text-sm sm:text-base text-zinc-600 mt-2">Try relaxing your filters or clearing them to see more.</p>
          </div>
        )}
      </div>
    </main>
  );
}
