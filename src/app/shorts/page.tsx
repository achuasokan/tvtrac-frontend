"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { tmdbService } from "@/services/tmdb.service";
import { useToggleWatchlist } from "@/hooks/useToggleWatchlist";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Plus,
  Check,
  Play,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Bookmark,
  FolderPlus,
  Maximize2,
  Minimize2,
  AlertCircle
} from "lucide-react";
import { AddToListModal } from "@/features/lists/components/AddToListModal";

interface TrailerItem {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  genres: string[];
  trailer_key: string;
  trailer_name: string;
}

export default function ShortsPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const toggleWatchlistMutation = useToggleWatchlist();

  const [trailers, setTrailers] = useState<TrailerItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [isFillMode, setIsFillMode] = useState(false);
  const [failedTrailers, setFailedTrailers] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Initial Trailers
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        setIsLoading(true);
        const data = await tmdbService.getTrailers(1);
        if (isMounted) {
          setTrailers(data.results || []);
          setHasMore((data.results || []).length > 0);
          setPage(1);
        }
      } catch (err) {
        console.error("Failed to load trailers:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch More Trailers on Infinite Scroll
  const fetchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await tmdbService.getTrailers(nextPage);
      const newItems: TrailerItem[] = data.results || [];
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setTrailers((prev) => {
          const existingIds = new Set(prev.map((t) => `${t.media_type}-${t.id}`));
          const unique = newItems.filter((t) => !existingIds.has(`${t.media_type}-${t.id}`));
          return [...prev, ...unique];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to fetch more trailers:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore]);

  // Scroll to index helper
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!containerRef.current) return;
      const targetIndex = Math.max(0, Math.min(index, trailers.length - 1));
      const { clientHeight } = containerRef.current;
      containerRef.current.scrollTo({
        top: targetIndex * clientHeight,
        behavior: "smooth"
      });
    },
    [trailers.length]
  );

  // Handle Scroll to update activeIndex
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight === 0) return;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < trailers.length) {
      // Pause previous video iframe
      const prevIframe = document.getElementById(`trailer-iframe-${activeIndex}`) as HTMLIFrameElement;
      if (prevIframe?.contentWindow) {
        prevIframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
      }
      setActiveIndex(newIndex);
      setIsPlaying(true);
      // If user unmuted, carry forward sound to next video without changing iframe src
      if (!isMuted) {
        setTimeout(() => {
          const nextIframe = document.getElementById(`trailer-iframe-${newIndex}`) as HTMLIFrameElement;
          nextIframe?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "unMute", args: "" }),
            "*"
          );
        }, 500);
      }
      // Preload next batch when 3 items from the end
      if (newIndex >= trailers.length - 3) {
        fetchMore();
      }
    }
  };

  // Intelligent Back navigation (bypasses YouTube iframe history stack)
  const handleBack = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      if (typeof window !== "undefined" && document.referrer) {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.host === window.location.host && referrerUrl.pathname !== "/shorts") {
          router.push(referrerUrl.pathname + referrerUrl.search);
          return;
        }
      }
    } catch {
      // Fallback
    }
    router.push("/discover");
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "Escape") {
        handleBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, trailers.length, handleBack, scrollToIndex]);

  // Listen for YouTube IFrame embed errors (geo-restriction 150/101, removed video 100, etc.)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (
          data?.event === "onError" ||
          data?.info === 150 ||
          data?.info === 101 ||
          data?.info === 100 ||
          data?.info === 2
        ) {
          setFailedTrailers((prev) => ({ ...prev, [activeIndex]: true }));
        }
      } catch {
        // Ignore non-JSON messages
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activeIndex]);

  const currentItem = trailers[activeIndex];

  // Watchlist status
  const isShow = currentItem?.media_type === "tv";
  const watchlist = isShow ? user?.watchlistShows || [] : user?.watchlistMovies || [];
  const isAdded = currentItem ? watchlist.includes(currentItem.id.toString()) : false;

  const handleToggleWatchlist = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentItem) return;
    toggleWatchlistMutation.mutate({
      tmdbId: currentItem.id,
      mediaType: currentItem.media_type,
      isAdded
    });
  };

  // Toggle Video Play / Pause cleanly via postMessage
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlaying((prev) => {
      const next = !prev;
      const iframe = document.getElementById(`trailer-iframe-${activeIndex}`) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: next ? "playVideo" : "pauseVideo",
            args: ""
          }),
          "*"
        );
      }
      return next;
    });
  };

  // Toggle Audio Mute cleanly via postMessage
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    const iframe = document.getElementById(`trailer-iframe-${activeIndex}`) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: next ? "mute" : "unMute",
          args: ""
        }),
        "*"
      );
    }
  };

  // Double tap to like / add to watchlist, single tap to play/pause
  const lastTapRef = useRef<number>(0);
  const handleCardTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isAdded) {
        handleToggleWatchlist();
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center gap-4 text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-[#2dd4bf] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#2dd4bf] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (trailers.length === 0) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center gap-4 text-white px-4 text-center">
        <p className="text-lg font-bold">No trailers available right now.</p>
        <button
          onClick={() => router.push("/discover")}
          className="px-5 py-2.5 rounded-full bg-[#2dd4bf] text-black font-bold text-sm hover:brightness-110 transition-all cursor-pointer"
        >
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden font-sans select-none flex items-center justify-center">
      {/* Global Ambient Glow on desktop based on active trailer backdrop */}
      {currentItem?.backdrop_path && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 pointer-events-none transition-all duration-700 hidden sm:block"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/w1280${currentItem.backdrop_path})`
          }}
        />
      )}

      {/* Main Centered Vertical Cinema Frame (Full Height Desktop Theater Touching Top & Bottom) */}
      <div className="relative w-full h-full sm:w-[540px] md:w-[620px] lg:w-[700px] xl:w-[760px] 2xl:w-[820px] sm:h-full sm:max-h-none sm:rounded-none sm:border-x sm:border-white/10 sm:shadow-[0_0_100px_rgba(0,0,0,0.95)] bg-black overflow-hidden flex flex-col justify-between transition-all duration-300">
        
        {/* Persistent Fixed Back Button (Instant 1-Click Navigation, Bypasses Iframe History) */}
        <div className="absolute top-3.5 sm:top-5 left-3.5 sm:left-5 z-50 pointer-events-auto">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.8)] border border-white/15 backdrop-blur-xl"
            title="Go Back (Esc)"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Snap Feed of Trailers */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {trailers.map((item, index) => {
            const isActive = index === activeIndex;
            const itemYear = item.release_date ? new Date(item.release_date).getFullYear() : null;

            return (
              <div
                key={`${item.media_type}-${item.id}-${index}`}
                className="h-full w-full snap-start relative bg-black overflow-hidden"
              >
                {/* Full-Height YouTube Iframe (Completely Free of Controls & Title) */}
                <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
                  {failedTrailers[index] ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950 px-6 text-center z-20">
                      {item.backdrop_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-sm"
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center max-w-xs">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-3 backdrop-blur-md shadow-lg">
                          <AlertCircle className="w-6 h-6 text-amber-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">Trailer Restricted in Your Region</h4>
                        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                          The studio has geo-blocked this YouTube embed in your country.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => scrollToIndex(index + 1)}
                            className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all cursor-pointer shadow-lg active:scale-95"
                          >
                            Next Trailer ↓
                          </button>
                          <a
                            href={`https://www.youtube.com/watch?v=${item.trailer_key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold transition-all active:scale-95"
                          >
                            Open on YouTube ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : isActive ? (
                    <iframe
                      id={`trailer-iframe-${index}`}
                      src={`https://www.youtube-nocookie.com/embed/${item.trailer_key}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${item.trailer_key}&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0`}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={
                        isFillMode
                          ? {
                              height: "calc(100% + 140px)",
                              width: "calc((100dvh + 140px) * 16 / 9)",
                              minWidth: "calc((100dvh + 140px) * 16 / 9)",
                              maxWidth: "none"
                            }
                          : {}
                      }
                      className={`border-0 pointer-events-none transition-all duration-300 shrink-0 ${
                        isFillMode
                          ? "h-[calc(100%+140px)] -mt-[70px] max-w-none"
                          : "w-full h-[calc(100%+140px)] -mt-[70px]"
                      }`}
                    />
                  ) : (
                    // Poster fallback when not active
                    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                      {item.backdrop_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w1280${item.backdrop_path}`}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-50"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Top Mask to guarantee YouTube title is 100% blocked */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/95 to-transparent pointer-events-none z-10" />

                  {/* Transparent Click Catcher for Play/Pause and Double-Tap Like */}
                  <div
                    onClick={handleCardTap}
                    className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center"
                  >
                    {/* Centered Play icon when paused */}
                    <AnimatePresence>
                      {!isPlaying && isActive && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl pointer-events-none"
                        >
                          <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Double-Tap Heart Animation */}
                    <AnimatePresence>
                      {showHeartAnim && isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.4, opacity: 1 }}
                          exit={{ scale: 1.8, opacity: 0 }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#2dd4bf]/20 backdrop-blur-md border border-[#2dd4bf]/60 flex items-center justify-center shadow-[0_0_40px_rgba(45,212,191,0.6)]">
                            <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-[#2dd4bf] fill-[#2dd4bf]" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Bottom Vignette for text readability */}
                <div className="absolute inset-x-0 bottom-0 h-48 sm:h-56 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none z-20" />

                {/* Bottom-Left Info Overlay */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-20 sm:right-24 z-30 flex flex-col gap-1 sm:gap-1.5 pointer-events-none">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg line-clamp-1">
                    {item.title}
                  </h1>

                  {/* Clean Sub-Info Row (Cinejoy Style) */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-300">
                    {itemYear && <span>{itemYear}</span>}
                    {item.vote_average ? (
                      <>
                        <span>•</span>
                        <span className="text-[#2dd4bf] flex items-center gap-0.5">
                          ★ {item.vote_average.toFixed(1)}
                        </span>
                      </>
                    ) : null}
                    <span>•</span>
                    <span className="capitalize">{item.media_type === "tv" ? "TV Show" : "Movie"}</span>
                  </div>
                </div>

                {/* Right-Side Action Rail (Cinejoy Style: Borderless Glassmorphism) */}
                <div className="absolute right-3.5 sm:right-5 bottom-4 sm:bottom-6 z-30 flex flex-col items-center gap-3 sm:gap-4 pointer-events-auto">
                  {/* Poster Thumbnail */}
                  {item.poster_path ? (
                    <button
                      onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
                      className="w-10 h-14 sm:w-11 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all bg-zinc-900 border-0"
                      title="View Details"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w200${item.poster_path}`}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ) : null}

                  {/* Watchlist Toggle Button (Dedicated Quick Bookmark) */}
                  <button
                    onClick={handleToggleWatchlist}
                    disabled={toggleWatchlistMutation.isPending}
                    className="group relative flex flex-col items-center justify-center w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-xl transition-all duration-200 active:scale-90 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-0 text-white"
                    title={isAdded ? "Remove from Watchlist" : "Add to Watchlist"}
                  >
                    <Bookmark
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isAdded ? "text-green-400 fill-green-400" : "text-white"
                      }`}
                    />
                    <span className="text-[9px] font-bold text-zinc-300 group-hover:text-white transition-colors mt-0.5 leading-none">
                      {isAdded ? "Saved" : "Watchlist"}
                    </span>
                  </button>

                  {/* Custom Lists Button (Opens AddToListModal) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddToListModalOpen(true);
                    }}
                    className="group relative flex flex-col items-center justify-center w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-xl transition-all duration-200 active:scale-90 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-0 text-white"
                    title="Add to Custom List"
                  >
                    <FolderPlus className="w-4 h-4 text-white group-hover:text-[#2dd4bf] transition-colors shrink-0" />
                    <span className="text-[9px] font-bold text-zinc-300 group-hover:text-white transition-colors mt-0.5 leading-none">
                      List
                    </span>
                  </button>

                  {/* Audio Toggle Button (Borderless Glassmorphism - No Teal Background) */}
                  <button
                    onClick={toggleMute}
                    className="group flex flex-col items-center justify-center w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-xl text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-0"
                    title={isMuted ? "Unmute Audio (M)" : "Mute Audio (M)"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white transition-colors shrink-0" />
                    )}
                    <span className="text-[9px] font-bold text-zinc-300 group-hover:text-white transition-colors mt-0.5 leading-none">
                      Audio
                    </span>
                  </button>

                  {/* Fill / Fit Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFillMode((prev) => !prev);
                    }}
                    className="group flex flex-col items-center justify-center w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-xl text-white transition-all duration-200 active:scale-90 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.6)] border-0"
                    title={isFillMode ? "Fit Screen (Show Full 16:9 Trailer)" : "Fill Screen (Edge to Edge, Zero Bars)"}
                  >
                    {isFillMode ? (
                      <Minimize2 className="w-4 h-4 text-white group-hover:text-[#2dd4bf] transition-colors shrink-0" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-white group-hover:text-[#2dd4bf] transition-colors shrink-0" />
                    )}
                    <span className="text-[9px] font-bold text-zinc-300 group-hover:text-white transition-colors mt-0.5 leading-none">
                      {isFillMode ? "Fit" : "Fill"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Outside Up/Down Navigation Chevrons */}
      <div className="hidden sm:flex flex-col gap-3 ml-4 lg:ml-6 z-40">
        <button
          onClick={() => scrollToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-black/50 hover:bg-black/75 disabled:opacity-25 disabled:pointer-events-none text-white border-0 flex items-center justify-center transition-all cursor-pointer shadow-xl backdrop-blur-xl active:scale-95"
          title="Previous Trailer (Up Arrow / K)"
        >
          <ChevronUp className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
        <button
          onClick={() => scrollToIndex(activeIndex + 1)}
          disabled={activeIndex === trailers.length - 1}
          className="w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-black/50 hover:bg-black/75 disabled:opacity-25 disabled:pointer-events-none text-white border-0 flex items-center justify-center transition-all cursor-pointer shadow-xl backdrop-blur-xl active:scale-95"
          title="Next Trailer (Down Arrow / J)"
        >
          <ChevronDown className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
      </div>
      {/* Add To Custom List Modal */}
      {currentItem && (
        <AddToListModal
          isOpen={isAddToListModalOpen}
          onClose={() => setIsAddToListModalOpen(false)}
          tmdbId={currentItem.id.toString()}
          mediaType={currentItem.media_type}
        />
      )}
    </div>
  );
}
