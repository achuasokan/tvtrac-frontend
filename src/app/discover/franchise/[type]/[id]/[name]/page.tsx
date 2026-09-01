"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { api } from "@/lib/api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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

const itemKey = (item: TmdbItem) => `${item.media_type}-${item.id}-${item.first_air_date || item.release_date || ''}`;

function ProjectorBeamTrack() {
  return (
    <div
      className="absolute pointer-events-none overflow-hidden"
      style={{ top:
         "calc(50% - 8px)", left: 100, right: 0, height: 16 }}
    >
      {/* Base Beam Line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-500/50 via-yellow-500/40 to-zinc-800/60" />
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-amber-400/40 blur-[0.5px]" />

      {/* Floating dust motes / light particles traveling along the beam */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-amber-200/70 blur-[0.5px]"
          style={{
            top: `${6 + (i % 3) * 2}px`,
            width: i % 2 === 0 ? 2.5 : 1.5,
            height: i % 2 === 0 ? 2.5 : 1.5,
          }}
          initial={{ x: "-10%", opacity: 0 }}
          animate={{
            x: ["0%", "1200%"],
            opacity: [0, 0.8, 0.8, 0],
            y: [0, i % 2 === 0 ? -2 : 2, 0],
          }}
          transition={{
            duration: 7 + i * 1.4,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

function ProjectorStartLens() {
  return (
    <motion.div
      className="relative z-20 flex-none flex flex-col items-center justify-center"
      style={{ width: 100, height: "100%" }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Projector Lens Housing */}
      <div
        className="absolute z-10 flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/70 bg-[#050505] shadow-[0_0_24px_rgba(245,158,11,0.55)]"
        style={{ top: "calc(50% - 18px)" }}
      >
        {/* Anamorphic Golden Flare Streak */}
        <div className="absolute -left-6 right-0 h-0.5 bg-amber-400/80 blur-[1px] pointer-events-none" />

        {/* Outer Pulsing Lens Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-400/80"
          animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Camera Aperture / Lens Core */}
        <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-amber-950 border border-amber-300/90 overflow-hidden">
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-3.5 h-3.5 text-amber-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v6M19.79 7.5l-5.19 3M19.79 16.5l-5.19-3M12 21v-6M4.21 16.5l5.19-3M4.21 7.5l5.19 3" />
          </motion.svg>
        </div>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
        style={{ top: "calc(50% + 22px)" }}
      >
        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-amber-400 flex items-center gap-1 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
          START
        </p>
      </div>
    </motion.div>
  );
}

function CameraApertureNode({ isWatched }: { isWatched: boolean }) {
  return (
    <motion.div
      className={`absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
        isWatched
          ? "border-amber-400 bg-amber-950/90 shadow-[0_0_18px_rgba(245,158,11,0.85)] text-amber-300"
          : "border-zinc-700 bg-[#050505] group-hover:border-amber-400 group-hover:bg-amber-950/40 text-zinc-600 group-hover:text-amber-300"
      }`}
      style={{ top: "calc(50% - 12px)", left: "calc(50% - 12px)" }}
      animate={isWatched ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      whileHover={{ scale: 1.35, rotate: 45 }}
      transition={{ duration: 0.3 }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <circle cx="12" cy="12" r="8" />
        <path d="M14.5 9l-5 6M9.5 9l5 6" strokeLinecap="round" />
      </svg>
      {isWatched && (
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-400"
          animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}

function SpotlightCone({ isTop, isWatched }: { isTop: boolean; isWatched: boolean }) {
  if (!isWatched) return null;

  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-[2]"
      style={{
        width: 140,
        ...(isTop
          ? {
              bottom: "50%",
              height: "calc(50dvh - 90px)",
              clipPath: "polygon(42% 100%, 58% 100%, 100% 0, 0 0)",
            }
          : {
              top: "50%",
              height: "calc(50dvh - 90px)",
              clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
            }),
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.35, 0.65, 0.45] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Volumetric Theater Spotlight Fill */}
      <div
        className={`w-full h-full bg-gradient-to-${
          isTop ? "t" : "b"
        } from-amber-500/30 via-yellow-500/15 to-transparent blur-xs`}
      />
    </motion.div>
  );
}

export default function FranchiseTimelinePage() {
  const router = useRouter();
  const params = useParams();
  const type = params.type as string;
  const entityId = params.id as string;
  const franchiseName = decodeURIComponent(params.name as string);
  const { user } = useSelector((state: RootState) => state.auth);
  const queryClient = useQueryClient();

  const [watchedMap, setWatchedMap] = useState<Record<string, boolean>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fetchedStatusRef = useRef<Set<string>>(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage: loadingMore,
    isLoading,
    isFetching
  } = useInfiniteQuery({
    queryKey: ['franchise-timeline', type, entityId, franchiseName],
    queryFn: async ({ pageParam = 1 }) => {

      if (type === "collection") {
        const collectionIds = decodeURIComponent(entityId).split(",");
        let collectionParts: TmdbItem[] = [];
        
        await Promise.all(
          collectionIds.map(async (idStr) => {
            const id = idStr.trim();
            if (id.startsWith("movie:")) {
              try {
                const movieId = id.replace("movie:", "");
                const details = await tmdbService.getTitleDetails("movie", movieId);
                if (details && details.id && details.release_date && details.poster_path) {
                  collectionParts.push({ ...details, media_type: "movie" as const });
                }
              } catch (e) {}
            } else {
              try {
                const col = await tmdbService.getCollection(id);
                if (col && Array.isArray(col.parts)) {
                  const parts = col.parts
                    .filter((i: any) => i.release_date && i.poster_path)
                    .map((i: any) => ({ ...i, media_type: "movie" as const }));
                  collectionParts.push(...parts);
                }
              } catch (e) {}
            }
          })
        );

        // Deduplicate & sort chronologically
        const uniqueMap = new Map<string, TmdbItem>();
        collectionParts.forEach(item => uniqueMap.set(itemKey(item), item));
        const merged = Array.from(uniqueMap.values()).sort((a, b) =>
          new Date(a.release_date || a.first_air_date || 0).getTime() -
          new Date(b.release_date || b.first_air_date || 0).getTime()
        );

        return { results: merged, nextPage: undefined };
      } else {
        const decodedName = decodeURIComponent(params.name as string);
        
        const isStarWarsValid = (title: string) => {
          if (decodedName !== "Star Wars") return true;
          const t = title.toLowerCase();
          
          // Exclude LEGO animations
          if (t.includes("lego")) return false;

          // Exclude animated series/movies
          if (
            t.includes("clone wars") ||
            t.includes("rebels") ||
            t.includes("bad batch") ||
            t.includes("resistance") ||
            t.includes("visions") ||
            t.includes("tales of the") ||
            t.includes("ewoks") ||
            t.includes("droids") ||
            t.includes("forces of destiny") ||
            t.includes("galaxy of adventures") ||
            t.includes("young jedi") ||
            t.includes("freemaker") ||
            t.includes("blips") ||
            t.includes("roll out") ||
            t.includes("micro-series")
          ) {
            return false;
          }
          
          // Keep only live-action canon / mainline movies & shows
          return (
            t.includes("star wars") ||
            t.includes("mandalorian") ||
            t.includes("andor") ||
            t.includes("ahsoka") ||
            t.includes("obi-wan") ||
            t.includes("obi wan") ||
            t.includes("boba fett") ||
            t.includes("acolyte") ||
            t.includes("skeleton crew")
          );
        };

        const isMcuValid = (title: string, releaseDate: string) => {
          if (decodedName !== "MCU") return true;

          // MCU officially started with Iron Man in 2008. Exclude anything earlier.
          const year = parseInt(releaseDate?.slice(0, 4) || "0", 10);
          if (year < 2008) return false;

          const t = title.toLowerCase();

          // Exclude non-MCU animated series & shows that Marvel Studios did NOT produce
          if (
            t.includes("x-men") ||
            t.includes("x men") ||
            t.includes("silver surfer") ||
            t.includes("mutant x") ||
            t.includes("spider-man unlimited") ||
            t.includes("super hero squad") ||
            t.includes("iron man: armored") ||
            t.includes("avengers: earth's mightiest") ||
            t.includes("ultimate spider-man") ||
            t.includes("avengers assemble") ||
            t.includes("phineas and ferb") ||
            t.includes("animation") ||
            t.includes("animated series")
          ) {
            return false;
          }

          return true;
        };

        const isJunkOrShort = (title: string) => {
          const t = title.toLowerCase();
          return (
            t.includes("one-shot") ||
            t.includes("one shot") ||
            t.includes("oneshot") ||
            t.includes("fan's guide") ||
            t.includes("peter's to-do list") ||
            t.includes("team darryl") ||
            t.includes("team thor") ||
            t.includes("item 47") ||
            t.includes("groot's pursuit") ||
            t.includes("groot's first steps") ||
            t.includes("groot takes a bath") ||
            t.includes("magnum opus") ||
            t.includes("the little guy") ||
            t.includes("groot noses around") ||
            t.includes("are you footgroot") ||
            t.includes("the great bought") ||
            t.includes("bounty hunters") ||
            t.includes("assembled:") ||
            t.includes("marvel studios: assembled") ||
            t.includes("assembling a universe") ||
            t.includes("assembling") ||
            t.includes("mpower") ||
            t.includes("75 years") ||
            t.includes("expanding the universe") ||
            t.includes("director's cut") ||
            t.includes("behind the scenes") ||
            t.includes("making of")
          );
        };

        const fetchMethod = type === "company" ? tmdbService.discoverByCompany : tmdbService.discoverByKeyword;
        const [moviesData, tvData] = await Promise.all([
          fetchMethod(entityId, `page=${pageParam}&type=movie&sort_by=primary_release_date.asc`),
          fetchMethod(entityId, `page=${pageParam}&type=tv&sort_by=first_air_date.asc`)
        ]);

        const movies = (moviesData.results || [])
          .filter((i: any) => i.release_date && i.poster_path && !isJunkOrShort(i.title || i.name || "") && isStarWarsValid(i.title || i.name || "") && isMcuValid(i.title || i.name || "", i.release_date || "") && (i.vote_count === undefined || i.vote_count >= 15))
          .map((i: any) => ({ ...i, media_type: "movie" as const }));
        const rawShows = (tvData.results || [])
          .filter((i: any) => i.first_air_date && i.poster_path && !isJunkOrShort(i.title || i.name || "") && isStarWarsValid(i.title || i.name || "") && isMcuValid(i.title || i.name || "", i.first_air_date || "") && (i.vote_count === undefined || i.vote_count >= 10))
          .map((i: any) => ({ ...i, media_type: "tv" as const }));

        // Expand multi-season TV series into separate season entries (e.g. Loki S1 in 2021, Loki S2 in 2023)
        const expandedShows: TmdbItem[] = [];
        await Promise.all(
          rawShows.map(async (show: any) => {
            try {
              const details = await tmdbService.getTitleDetails("tv", show.id);
              const seasons = (details.seasons || []).filter(
                (s: any) => s.season_number > 0 && s.air_date && s.poster_path
              );
              if (seasons.length > 1) {
                seasons.forEach((season: any) => {
                  expandedShows.push({
                    ...show,
                    title: `${show.name} S${season.season_number}`,
                    name: `${show.name} S${season.season_number}`,
                    poster_path: season.poster_path || show.poster_path,
                    first_air_date: season.air_date,
                    vote_average: season.vote_average || show.vote_average,
                    media_type: "tv" as const,
                  });
                });
              } else {
                expandedShows.push(show);
              }
            } catch {
              expandedShows.push(show);
            }
          })
        );

        const merged = [...movies, ...expandedShows];

        const moreMovies = moviesData.page < moviesData.total_pages;
        const moreTv = tvData.page < tvData.total_pages;
        return { 
          results: merged, 
          nextPage: ((moreMovies || moreTv) && pageParam < 10) ? pageParam + 1 : undefined 
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage?.nextPage,
    initialPageParam: 1,
    enabled: !!entityId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const rawResults = data?.pages.flatMap(p => p?.results || []) || [];
  
  const results = useMemo(() => {
    const uniqueMap = new Map<string, TmdbItem>();
    rawResults.forEach(item => uniqueMap.set(itemKey(item), item));
    return Array.from(uniqueMap.values()).sort((a, b) =>
      new Date(a.release_date || a.first_air_date || 0).getTime() -
      new Date(b.release_date || b.first_air_date || 0).getTime()
    );
  }, [rawResults]);

  const fetchWatchedStatuses = useCallback(async (items: TmdbItem[]) => {
    if (!user) return;
    const pending = items.filter(i => !fetchedStatusRef.current.has(itemKey(i)));
    if (pending.length === 0) return;

    pending.forEach(i => fetchedStatusRef.current.add(itemKey(i)));

    const entries = await Promise.all(
      pending.map(async (item) => {
        try {
          const res = await api.get(`/tracking/watched/status/${item.media_type}/${item.id}`);
          return [itemKey(item), res.data.watched as boolean] as const;
        } catch {
          return [itemKey(item), false] as const;
        }
      })
    );

    setWatchedMap(prev => ({ ...prev, ...Object.fromEntries(entries) }));
  }, [user]);

  useEffect(() => {
    if (results.length > 0) fetchWatchedStatuses(results);
  }, [results, fetchWatchedStatuses]);

  const handleToggleWatched = async (e: React.MouseEvent, item: TmdbItem) => {
    e.stopPropagation();
    if (!user) return router.push("/login");

    const key = itemKey(item);
    if (togglingIds.has(key)) return;

    setTogglingIds(prev => new Set(prev).add(key));
    try {
      const res = await api.post("/tracking/watched/toggle", {
        tmdbId: String(item.id),
        mediaType: item.media_type,
      });
      setWatchedMap(prev => ({ ...prev, [key]: res.data.watched }));
      queryClient.invalidateQueries({ queryKey: ['profile', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['title-details', item.media_type, String(item.id)] });
    } catch (err) {
      console.error("Failed to toggle watched:", err);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const watchedCount = useMemo(
    () => results.filter(i => watchedMap[itemKey(i)]).length,
    [results, watchedMap]
  );

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
      if (nearEnd && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasNextPage, isFetching, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#050505] text-white" style={{ height: "100dvh" }}>
        <div className="h-9 w-9 rounded-full border-4 border-zinc-800 border-t-amber-500 animate-spin shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
        <p className="mt-4 text-amber-400/90 font-bold tracking-[0.25em] uppercase text-xs">Constructing Timeline...</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-[#050505] text-white"
      // The app-wide bottom navigation is fixed and 72px tall. Reserving its
      // space keeps the lower timeline cards fully visible above it.
      style={{ height: "calc(100dvh - 72px)" }}
    >

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
          <p className="text-amber-400 text-[9px] font-black tracking-[0.3em] uppercase">Viewing Order</p>
          <h1 className="text-base sm:text-xl font-black tracking-tighter text-white leading-none">{franchiseName}</h1>
          {results.length > 0 && user && (
            <motion.p
              className="mt-1 text-[9px] font-bold text-zinc-400"
              key={watchedCount}
              initial={{ opacity: 0.5, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {watchedCount}/{results.length} watched
            </motion.p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           DESKTOP HORIZONTAL TIMELINE (md and above)
          ═══════════════════════════════════════════════════ */}
      <div
        ref={scrollContainerRef}
        className="flex flex-1 min-h-0 snap-x snap-mandatory items-center overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden cursor-grab touch-pan-x active:cursor-grabbing"
        style={{ scrollBehavior: "auto" }}
      >
        <div className="relative flex h-full items-center px-8 sm:px-[60px]">

          <ProjectorBeamTrack />

          {/* Projector Lens Start Indicator */}
          <ProjectorStartLens />

          {results.map((item, index) => {
            const date = item.release_date || item.first_air_date || "";
            const year = date.slice(0, 4);
            const isTop = index % 2 === 0;
            const key = itemKey(item);
            const isWatched = !!watchedMap[key];
            const isToggling = togglingIds.has(key);

            return (
              <motion.div
                key={key}
                className="group relative flex h-full flex-none snap-center items-center justify-center"
                style={{ width: "clamp(124px, calc(30dvh - 60px), 280px)" }}
                initial={{ opacity: 0, y: isTop ? -16 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(index * 0.025, 0.2) }}
              >
                {/* Theater Spotlight Cone illuminating the poster */}
                <SpotlightCone isTop={isTop} isWatched={isWatched} />

                {/* Volumetric Beam Segment when watched */}
                {isWatched && (
                  <motion.div
                    className="absolute left-0 right-0 z-[1] pointer-events-none"
                    style={{ top: "calc(50% - 1.25px)", height: 2.5 }}
                    initial={{ opacity: 0, scaleX: 0.3 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.85)]" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/90 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "linear", delay: index * 0.12 }}
                    />
                  </motion.div>
                )}

                {/* Camera Aperture Node on the line */}
                <CameraApertureNode isWatched={isWatched} />

                {/* Stem */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-px transition-all duration-300 ${
                    isWatched
                      ? "bg-gradient-to-b from-amber-400 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                      : "bg-zinc-700 group-hover:bg-amber-400"
                  }`}
                  style={isTop ? { bottom: "50%", height: 28 } : { top: "50%", height: 28 }}
                />

                {/* Year label — opposite side */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-black tracking-tight transition-colors sm:text-sm ${
                    isWatched ? "text-amber-300 font-extrabold shadow-amber-400/50 drop-shadow-sm" : "text-zinc-600 group-hover:text-zinc-400"
                  }`}
                  style={isTop ? { top: "calc(50% + 16px)" } : { bottom: "calc(50% + 16px)" }}
                >
                  {year}
                </div>

                {/* Card — sits in the top or bottom half */}
                <div
                  onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
                  className={`group/card absolute left-1/2 -translate-x-1/2 cursor-pointer overflow-hidden rounded-xl border bg-zinc-900 transition-all duration-300 hover:scale-105 ${
                    isWatched
                      ? "border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.3)] opacity-95"
                      : "border-white/5 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  }`}
                  style={{
                    width: "clamp(84px, calc(25dvh - 55px), 230px)",
                    ...(isTop ? { bottom: "calc(50% + 40px)" } : { top: "calc(50% + 40px)" }),
                  }}
                >
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2/3" }}>
                    <img
                      src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                      alt={item.title || item.name}
                      className={`w-full h-full object-cover transition-all duration-300 ${isWatched ? "brightness-90 saturate-85" : ""}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {isWatched && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-yellow-500/10 to-transparent pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <div className="absolute left-1.5 top-1.5 rounded bg-black/70 backdrop-blur-xs px-1 py-0.5 text-[6px] font-black uppercase tracking-widest text-amber-300 border border-amber-500/30 sm:px-1.5 sm:text-[7px]">
                      {item.media_type === "movie" ? "Movie" : "Series"}
                    </div>
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleWatched(e, item)}
                        disabled={isToggling}
                        title={isWatched ? "Mark as unwatched" : "Mark as watched"}
                        className={`absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 hover:scale-110 sm:h-7 sm:w-7 ${
                          isWatched
                            ? "border-amber-400/80 bg-amber-500/30 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
                            : "border-white/20 bg-black/60 hover:border-amber-400/60"
                        }`}
                      >
                        {isToggling ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : isWatched ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    )}
                    {item.vote_average ? (
                      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[7px] font-bold text-white sm:px-1.5 sm:text-[8px]">
                        ★ {item.vote_average.toFixed(1)}
                      </div>
                    ) : null}
                  </div>
                  <div className="bg-zinc-900/90 px-1.5 py-1 sm:px-2 sm:py-1.5">
                    <p className={`line-clamp-2 text-[9px] font-bold leading-tight transition-colors sm:text-[10px] ${
                      isWatched ? "text-amber-200" : "text-white group-hover/card:text-amber-300"
                    }`}>
                      {item.title || item.name}
                    </p>
                    <p className={`mt-0.5 text-[8px] font-semibold sm:text-[9px] ${isWatched ? "text-amber-400/90" : "text-amber-500/80"}`}>
                      {isWatched ? "Watched" : year}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {loadingMore && (
            <div className="flex-none flex items-center justify-center" style={{ width: 80, height: "100%" }}>
              <div className="w-5 h-5 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           MOBILE VERTICAL TIMELINE (below md)
          ═══════════════════════════════════════════════════ */}
      <div className="hidden">
        <div className="mb-4 flex items-end justify-between px-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">Viewing order</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">Follow the timeline</h2>
          </div>
          <span className="text-[10px] font-bold text-zinc-500">{results.length} titles</span>
        </div>
        <div className="relative space-y-4 pb-4">
          <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-zinc-800" />
            {results.map((item, index) => {
              const date = item.release_date || item.first_air_date || "";
              const year = date.slice(0, 4);
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={`${item.media_type}-${item.id}-${item.release_date || item.first_air_date || index}`}
                  className={`relative flex min-h-28 ${isLeft ? "justify-start" : "justify-end"}`}
                  initial={{ opacity: 0, x: isLeft ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(index * 0.03, 0.18) }}
                >
                  <motion.div
                    className="absolute top-14 h-px bg-amber-500/40"
                    style={isLeft
                      ? { left: "calc(50% - 24px)", right: "50%", transformOrigin: "right" }
                      : { left: "50%", right: "calc(50% - 24px)", transformOrigin: "left" }
                    }
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.03 + 0.12, 0.3) }}
                  />
                  <motion.div
                    className="absolute left-1/2 top-10 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-[#050505] text-[8px] font-black text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.35)]"
                    initial={{ opacity: 0, scale: 0.45 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18, delay: Math.min(index * 0.03 + 0.16, 0.34) }}
                  >
                    {year}
                  </motion.div>
                  <motion.div
                    className="w-[calc(50%-24px)]"
                    whileHover={{ y: -2 }}
                  >
                  <button
                    onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
                    className="group flex h-28 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#15151a] text-left shadow-lg transition-colors duration-300 active:scale-[0.97]"
                  >
                    <div className="relative h-full w-[42%] flex-none overflow-hidden bg-zinc-800">
                      <img
                        src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#15151a]/70" />
                    </div>
                    <div className="flex h-full min-w-0 flex-1 flex-col justify-center px-2.5 py-2.5">
                      <div className="mb-1 flex items-center gap-1">
                        <span className="text-[10px] font-black text-amber-400">{year}</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          {item.media_type === "movie" ? "Movie" : "Series"}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-xs font-bold leading-snug text-white group-hover:text-amber-300">{item.title || item.name}</h3>
                      <div className="mt-1">
                        {item.vote_average ? (
                          <span className="text-[10px] font-bold text-yellow-500">★ {item.vote_average.toFixed(1)}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Mobile load more */}
            {hasNextPage && !loadingMore && (
              <button
                onClick={() => fetchNextPage()}
                className="mx-auto flex w-[calc(50%-20px)] items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 px-4 py-4 text-center text-sm font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Load More
              </button>
            )}
            {loadingMore && (
              <div className="mx-auto flex w-[calc(50%-20px)] justify-center py-4">
                <div className="w-6 h-6 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
              </div>
            )}
        </div>
      </div>

    </div>
  );
}
