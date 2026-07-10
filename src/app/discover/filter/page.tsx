"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: string;
};

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
  
  // Results State
  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const fetchResults = async (currentPage: number, append: boolean, signal?: AbortSignal, retryCount = 0) => {
    if (retryCount === 0) {
      if (append) setIsFetchingMore(true);
      else {
        setIsLoading(true);
        setErrorMsg(null);
      }
    }

    try {
      const params: Record<string, string> = {
        type,
        page: currentPage.toString(),
        sort_by: "popularity.desc" // Removed vote_count to allow unrated regional shows
      };
      
      if (minRating !== "0") {
        params["vote_average.gte"] = minRating;
        params["vote_count.gte"] = "10"; // Only require votes if they actually want a rating filter
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

      const res = await api.get("/tmdb/discover/advanced", { params, signal });
      
      const filtered = res.data.results?.filter((item: any) => item.poster_path) || [];
      const mapped = filtered.map((item: any) => ({ ...item, media_type: type }));
      
      if (append) {
        setResults(prev => [...prev, ...mapped]);
      } else {
        setResults(mapped);
      }
      
      setTotalPages(res.data.total_pages || 1);
      setTotalResults(res.data.total_results || 0);
      
      setIsLoading(false);
      setIsFetchingMore(false);
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.name !== "AbortError") {
        console.error(`Failed to fetch advanced filter results (Attempt ${retryCount + 1})`, error);
        
        if (retryCount < 2) {
          // Auto-retry up to 2 times if TMDB randomly drops the connection
          setTimeout(() => {
            fetchResults(currentPage, append, signal, retryCount + 1);
          }, 1500);
        } else {
          setErrorMsg("TMDB servers are currently overloaded. Please try again in a moment.");
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      } else {
        // If aborted, we don't necessarily want to stop loading if another fetch took over,
        // but typically we can ignore it since the new fetch handles state.
      }
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
    setResults([]);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchResults(1, false, controller.signal);
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [type, year, genre, language, provider, status, minRating]);

  // Fetch more when page changes (but not on initial mount or filter reset)
  useEffect(() => {
    if (page > 1) {
      const controller = new AbortController();
      fetchResults(page, true, controller.signal);
      return () => controller.abort();
    }
  }, [page]);

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
      <div className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-xl border-b border-zinc-800/80 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Title & Back Button */}
            <div className="flex items-center gap-2">
              <button onClick={() => router.push("/discover")} className="text-zinc-400 hover:text-white transition-colors p-1 -ml-1 rounded-full hover:bg-zinc-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight flex items-baseline gap-2">
                Filter
                {totalResults !== null && (
                  <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">({totalResults.toLocaleString()} results)</span>
                )}
              </h1>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
              
              {/* Type Toggle */}
              <div className="flex bg-zinc-900/80 p-0.5 rounded-md border border-zinc-800">
                <button 
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-sm transition-all ${type === 'tv' ? 'bg-[#050505] text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => { setType('tv'); setGenre(''); setStatus(''); }}
                >
                  TV Shows
                </button>
                <button 
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-sm transition-all ${type === 'movie' ? 'bg-[#050505] text-white shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => { setType('movie'); setGenre(''); setStatus(''); }}
                >
                  Movies
                </button>
              </div>

              {/* Filters Toggle Button */}
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 border text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md transition-all ${showFilters || activeFilterCount > 0 ? 'bg-white text-black border-white shadow-md' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters {activeFilterCount > 0 && <span className="bg-black text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold ml-0.5 leading-none">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {/* Collapsible Filter Grid */}
          {showFilters && (
            <div className="pt-3 border-t border-zinc-800/50 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                <div className="relative">
                  <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md pl-2.5 pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:bg-zinc-800 font-medium shadow-inner">
                    <option value="">Any Platform</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="relative">
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md pl-2.5 pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:bg-zinc-800 font-medium shadow-inner">
                    <option value="">Any Language</option>
                    {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="relative">
                  <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md pl-2.5 pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:bg-zinc-800 font-medium shadow-inner">
                    <option value="">Any Genre</option>
                    {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="relative">
                  <select value={year} onChange={e => setYear(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md pl-2.5 pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:bg-zinc-800 font-medium shadow-inner">
                    <option value="">Any Year</option>
                    {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {type === "tv" && (
                  <div className="relative">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md pl-2.5 pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:bg-zinc-800 font-medium shadow-inner">
                      <option value="">Any Status</option>
                      {tvStatuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <select value={minRating} onChange={e => setMinRating(e.target.value)} className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md pl-2.5 pr-7 py-1.5 sm:py-2 text-[11px] sm:text-xs focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer hover:bg-zinc-800 font-medium shadow-inner">
                    <option value="0">Any Rating</option>
                    <option value="5">5.0+ Stars</option>
                    <option value="6">6.0+ Stars</option>
                    <option value="7">7.0+ Stars</option>
                    <option value="8">8.0+ Stars</option>
                    <option value="9">9.0+ Stars</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                
                {activeFilterCount > 0 && (
                  <div className="col-span-2 sm:col-span-3 lg:col-span-6 flex justify-end mt-1">
                    <button 
                      onClick={() => { setYear(''); setGenre(''); setLanguage(''); setProvider(''); setStatus(''); setMinRating('0'); }}
                      className="text-[10px] sm:text-xs font-bold text-red-500 hover:text-red-400 py-1 px-2 transition-colors flex items-center gap-1 rounded-md hover:bg-red-950/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
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
              onClick={() => fetchResults(1, false)}
              className="bg-white text-black font-bold py-2 px-6 rounded-md hover:bg-zinc-200 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="pb-10">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 mb-8">
              {results.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="group cursor-pointer flex flex-col gap-2" onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}>
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
                    <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover" />
                    
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center transition-all duration-300 z-20 shadow-lg md:opacity-0 md:scale-75 md:group-hover:opacity-100 md:group-hover:scale-100"
                      title="Add to List"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <h3 className="text-[11px] sm:text-xs font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{item.title || item.name}</h3>
                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                        {item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : '')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {page < totalPages && (
              <div className="flex justify-center mt-6 mb-12">
                <button 
                  onClick={() => setPage(p => p + 1)}
                  disabled={isFetchingMore}
                  className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-white font-bold py-2.5 px-8 rounded-full transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isFetchingMore ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Results"
                  )}
                </button>
              </div>
            )}
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
