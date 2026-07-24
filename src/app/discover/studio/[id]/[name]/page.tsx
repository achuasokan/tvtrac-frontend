"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { tmdbService } from "@/services/tmdb.service";
import { profileService } from "@/features/profile/api/profile.service";
import { setUser } from "@/store/slices/authSlice";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { motion } from "framer-motion";

// Global cache for studio discovery results
const studioResultsCache = new Map<string, TmdbItem[]>();

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
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(prev => !prev);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
          isActive
            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
        }`}
      >
        {icon}
        {displayLabel}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div 
            ref={menuRef}
            className="fixed w-[120px] max-h-52 overflow-y-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-lg shadow-2xl py-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                  value === opt.value
                    ? "bg-purple-500/20 text-purple-300"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
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

export default function DiscoverStudioPage() {
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const companyId = params.id as string;
  const studioName = decodeURIComponent(params.name as string);

  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const dispatch = useDispatch();
  
  const [filter, setFilter] = useState<"tv" | "movie">((searchParams.get("type") as "tv" | "movie") || "movie");
  const [sortBy, setSortBy] = useState(searchParams.get("sort_by") || "popularity.desc");
  const [minRating, setMinRating] = useState(searchParams.get("min_rating") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [language, setLanguage] = useState(searchParams.get("language") || "");

  const hasActiveFilters = minRating !== "" || year !== "" || language !== "";

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (filter !== "movie") newParams.set("type", filter); else newParams.delete("type");
    if (sortBy !== "popularity.desc") newParams.set("sort_by", sortBy); else newParams.delete("sort_by");
    if (minRating) newParams.set("min_rating", minRating); else newParams.delete("min_rating");
    if (year) newParams.set("year", year); else newParams.delete("year");
    if (language) newParams.set("language", language); else newParams.delete("language");
    const newUrl = `${pathname}?${newParams.toString()}`;
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    if (newUrl !== currentUrl) router.replace(newUrl, { scroll: false });
  }, [filter, sortBy, minRating, year, language, pathname, searchParams, router]);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/");
  }, [user, isAuthLoading, router]);

  const buildQueryParams = (pageNumber: number, currentFilter: string) => {
    const p = new URLSearchParams();
    p.set("page", String(pageNumber));
    p.set("type", currentFilter);
    p.set("sort_by", sortBy);
    if (minRating) p.set("min_rating", minRating);
    if (year) { p.set("year_from", year); p.set("year_to", year); }
    if (language) p.set("language", language);
    return p.toString();
  };

  const fetchStudioContent = async (pageNumber: number, currentFilter: string, isInitial = false) => {
    if (!companyId) return;
    try {
      if (isInitial) setIsLoading(true);
      else setLoadingMore(true);

      const queryString = buildQueryParams(pageNumber, currentFilter);
      const data = await tmdbService.discoverByCompany(companyId, queryString);
      const newResults = (data.results?.filter((item: any) => item.poster_path) || [])
        .map((item: any) => ({ ...item, media_type: currentFilter }));

      if (isInitial) setResults(newResults);
      else setResults(prev => [...prev, ...newResults]);

      setHasMore(data.page < data.total_pages && pageNumber < 100);
    } catch (error) {
      console.error("Failed to fetch studio content:", error);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      setPage(1);
      fetchStudioContent(1, filter, true);
    }
  }, [companyId, filter, sortBy, minRating, year, language]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchStudioContent(nextPage, filter);
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
        <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
                isAdded ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/90 hover:bg-white text-black'
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
      <div className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-xl pt-4 sm:pt-6 pb-3 sm:pb-4 px-3 sm:px-4 border-b border-zinc-800/60">
        <div className="w-full max-w-5xl mx-auto flex items-center gap-2 sm:gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors border border-zinc-800 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">{studioName}</h2>
        </div>

        <div className="w-full max-w-5xl mx-auto mt-3 sm:mt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-0.5">
          <div className="flex items-center gap-2">
            {[
              { id: "movie", label: "Movies" },
              { id: "tv", label: "TV Shows" },
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
                className={`flex-shrink-0 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-all border ${
                  filter === f.id 
                    ? "bg-white text-black border-white" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-6 bg-zinc-700 flex-shrink-0 mx-2 sm:mx-4" />

          <div className="flex items-center gap-1.5 sm:gap-2 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-4 sm:pr-0">
            <PillDropdown
              label="Sort"
              value={sortBy === "popularity.desc" ? "" : sortBy}
              options={SORT_OPTIONS.map(o => ({ value: o.id === "popularity.desc" ? "" : o.id, label: o.label }))}
              onChange={(val) => setSortBy(val || "popularity.desc")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              }
            />
            <PillDropdown
              label="Year"
              value={year}
              options={YEAR_OPTIONS}
              onChange={setYear}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <PillDropdown
              label="Rating"
              value={minRating}
              options={RATING_OPTIONS}
              onChange={setMinRating}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
            <PillDropdown
              label="Language"
              value={language}
              options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
              onChange={setLanguage}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              }
            />
            {hasActiveFilters && (
              <>
                <div className="w-px h-4 bg-zinc-800 flex-shrink-0" />
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
