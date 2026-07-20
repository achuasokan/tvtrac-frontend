"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { tmdbService } from "@/services/tmdb.service";

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: "movie" | "tv";
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export default function FranchiseTimelinePage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as string;
  const entityId = params.id as string;
  const franchiseName = decodeURIComponent(params.name as string);

  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(1);

  const fetchTimelineContent = async (pageNumber: number, isInitial = false) => {
    if (!entityId || loadingRef.current) return;
    loadingRef.current = true;
    try {
      if (isInitial) setIsLoading(true);
      else setLoadingMore(true);

      const fetchMethod = type === "company" ? tmdbService.discoverByCompany : tmdbService.discoverByKeyword;
      const [moviesData, tvData] = await Promise.all([
        fetchMethod(entityId, `page=${pageNumber}&type=movie&sort_by=primary_release_date.asc`),
        fetchMethod(entityId, `page=${pageNumber}&type=tv&sort_by=first_air_date.asc`)
      ]);

      const movies = (moviesData.results || [])
        .filter((i: any) => i.release_date && i.poster_path)
        .map((i: any) => ({ ...i, media_type: "movie" }));
      const shows = (tvData.results || [])
        .filter((i: any) => i.first_air_date && i.poster_path)
        .map((i: any) => ({ ...i, media_type: "tv" }));

      const merged = [...movies, ...shows].sort((a, b) =>
        new Date(a.release_date || a.first_air_date || 0).getTime() -
        new Date(b.release_date || b.first_air_date || 0).getTime()
      );

      if (isInitial) {
        setResults(merged);
      } else {
        setResults(prev => {
          const ids = new Set(prev.map(i => `${i.media_type}-${i.id}`));
          const unique = merged.filter(i => !ids.has(`${i.media_type}-${i.id}`));
          return [...prev, ...unique].sort((a, b) =>
            new Date(a.release_date || a.first_air_date || 0).getTime() -
            new Date(b.release_date || b.first_air_date || 0).getTime()
          );
        });
      }

      const moreMovies = moviesData.page < moviesData.total_pages;
      const moreTv = tvData.page < tvData.total_pages;
      setHasMore((moreMovies || moreTv) && pageNumber < 10);
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (entityId) fetchTimelineContent(1, true);
  }, [entityId]);

  // Desktop: mouse wheel → horizontal scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // only hijack pure vertical scroll on desktop
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isLoading]);

  // Infinite scroll: watch scroll position on desktop
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 400;
      if (nearEnd && hasMore && !loadingRef.current) {
        const next = pageRef.current + 1;
        pageRef.current = next;
        setPage(next);
        fetchTimelineContent(next);
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#050505] text-white" style={{ height: "100dvh" }}>
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-purple-500 animate-spin" />
        <p className="mt-4 text-zinc-500 font-medium tracking-widest uppercase text-xs">Constructing Timeline...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#050505] text-white" style={{ height: "100dvh" }}>

      {/* Header */}
      <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#050505]/95 backdrop-blur-xl z-50">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="text-right">
          <p className="text-purple-400 text-[9px] font-black tracking-[0.3em] uppercase">Viewing Order</p>
          <h1 className="text-base sm:text-xl font-black tracking-tighter text-white leading-none">{franchiseName}</h1>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           DESKTOP HORIZONTAL TIMELINE (md and above)
          ═══════════════════════════════════════════════════ */}
      <div
        ref={scrollContainerRef}
        className="hidden md:flex flex-1 min-h-0 items-center overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
        style={{ scrollBehavior: "auto" }}
      >
        <div className="relative flex items-center h-full" style={{ paddingLeft: 60, paddingRight: 60 }}>

          {/* Horizontal line */}
          <div className="absolute left-0 right-0 h-px bg-zinc-800" style={{ top: "50%" }} />

          {results.map((item, index) => {
            const date = item.release_date || item.first_air_date || "";
            const year = date.slice(0, 4);
            const isTop = index % 2 === 0;

            return (
              <div
                key={`${item.media_type}-${item.id}`}
                className="relative flex-none flex justify-center items-center group"
                style={{ width: 180, height: "100%" }}
              >
                {/* Node on the line */}
                <div
                  className="absolute z-10 w-3 h-3 rounded-full border-2 border-zinc-600 bg-[#050505] group-hover:border-purple-400 group-hover:bg-purple-500 group-hover:scale-150 transition-all duration-300"
                  style={{ top: "calc(50% - 6px)", left: "calc(50% - 6px)" }}
                />

                {/* Stem */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-px bg-zinc-700 group-hover:bg-purple-500 transition-colors duration-300"
                  style={isTop ? { bottom: "50%", height: 28 } : { top: "50%", height: 28 }}
                />

                {/* Year label — opposite side */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-sm font-black tracking-tight text-zinc-600 group-hover:text-zinc-400 transition-colors whitespace-nowrap"
                  style={isTop ? { top: "calc(50% + 14px)" } : { bottom: "calc(50% + 14px)" }}
                >
                  {year}
                </div>

                {/* Card — sits in the top or bottom half */}
                <div
                  onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
                  className="absolute left-1/2 -translate-x-1/2 w-36 rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/40 cursor-pointer group/card transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] bg-zinc-900"
                  /*
                   * Previously the card had a `maxHeight: calc(50% - 60px)` constraint to keep it within the half‑height of the timeline.
                   * This caused the bottom cards to be clipped when the content (image + text) exceeded that height.
                   * Removing the maxHeight allows the card to size naturally while keeping the vertical offset.
                   */
                  style={isTop
                    ? { bottom: "calc(50% + 40px)" }
                    : { top: "calc(50% + 40px)" }
                  }
                >
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2/3" }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-1.5 left-1.5 text-[7px] font-black tracking-widest text-white/80 uppercase bg-black/50 px-1.5 py-0.5 rounded">
                      {item.media_type === "movie" ? "Movie" : "Series"}
                    </div>
                    {item.vote_average ? (
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">
                        ★ {item.vote_average.toFixed(1)}
                      </div>
                    ) : null}
                  </div>
                  <div className="px-2 py-1.5 bg-zinc-900">
                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-2 group-hover/card:text-purple-300 transition-colors">
                      {item.title || item.name}
                    </p>
                    <p className="text-[9px] text-purple-400 mt-0.5 font-semibold">{year}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {loadingMore && (
            <div className="flex-none flex items-center justify-center" style={{ width: 80, height: "100%" }}>
              <div className="w-5 h-5 border-2 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           MOBILE VERTICAL TIMELINE (below md)
          ═══════════════════════════════════════════════════ */}
      <div className="md:hidden flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden px-4 py-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-zinc-800" />

          <div className="flex flex-col gap-6">
            {results.map((item, index) => {
              const date = item.release_date || item.first_air_date || "";
              const year = date.slice(0, 4);

              return (
                <div key={`${item.media_type}-${item.id}`} className="relative flex items-start gap-4 group">
                  {/* Node */}
                  <div className="flex-none relative z-10 w-3 h-3 mt-3 rounded-full border-2 border-zinc-600 bg-[#050505] group-hover:border-purple-400 group-hover:bg-purple-500 transition-all duration-300 ml-3.5" />

                  {/* Card */}
                  <div
                    onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
                    className="flex-1 flex bg-zinc-900/60 rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all duration-300 shadow-lg active:scale-95"
                  >
                    <div className="relative w-24 flex-none" style={{ aspectRatio: "2/3" }}>
                      <img
                        src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
                    </div>
                    <div className="flex-1 px-4 py-3 flex flex-col justify-center">
                      <p className="text-purple-400 text-xs font-black mb-1">{year}</p>
                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-3">{item.title || item.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                          {item.media_type === "movie" ? "Movie" : "Series"}
                        </span>
                        {item.vote_average ? (
                          <span className="text-[10px] font-bold text-yellow-500">★ {item.vote_average.toFixed(1)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile load more */}
            {hasMore && !loadingMore && (
              <button
                onClick={() => {
                  const next = pageRef.current + 1;
                  pageRef.current = next;
                  setPage(next);
                  fetchTimelineContent(next);
                }}
                className="ml-10 mt-2 px-6 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-sm font-bold text-white hover:bg-zinc-800 transition-colors"
              >
                Load More
              </button>
            )}
            {loadingMore && (
              <div className="flex justify-center ml-10 mt-2">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-purple-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
