"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { api } from "@/lib/api";
import Link from "next/link";

const getProviderLink = (providerName: string, title: string, fallbackLink: string) => {
  const name = providerName.toLowerCase();
  const query = encodeURIComponent(title);
  
  if (name.includes('netflix')) return `https://www.netflix.com/search?q=${query}`;
  if (name.includes('amazon') || name.includes('prime')) return `https://www.amazon.com/s?k=${query}&i=movies-tv`;
  if (name.includes('disney')) return `https://www.disneyplus.com/search?q=${query}`;
  if (name.includes('hulu')) return `https://www.hulu.com/search?q=${query}`;
  if (name.includes('apple')) return `https://tv.apple.com/search?term=${query}`;
  if (name.includes('youtube')) return `https://www.youtube.com/results?search_query=${query}`;
  if (name.includes('max') || name.includes('hbo')) return `https://play.max.com/search?q=${query}`;
  
  return fallbackLink;
};

export default function EpisodeDetailsPage() {
  const { id, season_number, episode_number } = useParams();
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  const [details, setDetails] = useState<any>(null);
  const [seasonDetails, setSeasonDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatched, setIsWatched] = useState(false);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);
  const [isDescriptionRevealed, setIsDescriptionRevealed] = useState(false);
  const [watchedAt, setWatchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const guestStarsRef = useRef<HTMLDivElement>(null);
  const crewRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = window.innerWidth > 768 ? 600 : 300;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  
  // Prompt State
  const [watchedEpisodes, setWatchedEpisodes] = useState<{season: number, episode: number}[]>([]);
  const [ignorePrompt, setIgnorePrompt] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [missingPreviousEps, setMissingPreviousEps] = useState<number[]>([]);
  const [userCountry, setUserCountry] = useState("US");
  const [pendingRedirectLink, setPendingRedirectLink] = useState<string | null>(null);
  const [pendingProviderName, setPendingProviderName] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/country/')
      .then(res => res.text())
      .then(country => {
        if (country && country.length === 2) {
          setUserCountry(country.toUpperCase());
        }
      })
      .catch(() => {
        const lang = navigator.language;
        if (lang && lang.includes('-')) {
          setUserCountry(lang.split('-')[1].toUpperCase());
        }
      });
  }, []);

  useEffect(() => {
    // Only redirect if we have confirmed auth failed (we could check token)
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        // We fetch the episode details, season details, the tracking status for the entire series, and show details
        const [detailsRes, seasonRes, watchedRes, showRes] = await Promise.all([
          api.get(`/tmdb/tv/${id}/season/${season_number}/episode/${episode_number}`),
          api.get(`/tmdb/tv/${id}/season/${season_number}`),
          user ? api.get(`/tracking/watched/status/tv/${id}`).catch(() => ({ data: { watchedEpisodes: [] } })) : Promise.resolve({ data: { watchedEpisodes: [] } }),
          api.get(`/tmdb/title/tv/${id}`).catch(() => ({ data: null }))
        ]);
        
        setDetails(detailsRes.data);
        setSeasonDetails(seasonRes.data);
        setShowDetails(showRes.data);
        
        // Check if this specific episode is watched
        if (watchedRes.data.watchedEpisodes) {
          setWatchedEpisodes(watchedRes.data.watchedEpisodes);
          const matchedEp = watchedRes.data.watchedEpisodes.find(
            (ep: any) => ep.season === Number(season_number) && ep.episode === Number(episode_number)
          );
          if (matchedEp) {
            setIsWatched(true);
            setWatchedAt(matchedEp.watchedAt || null);
          } else {
            setIsWatched(false);
            setWatchedAt(null);
          }
        }
        if (watchedRes.data.ignorePreviousEpisodesPrompt !== undefined) {
          setIgnorePrompt(watchedRes.data.ignorePreviousEpisodesPrompt);
        }
      } catch (err) {
        console.error("Failed to fetch episode details:", err);
        setError("Failed to load episode details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && season_number && episode_number && user) {
      fetchDetails();
    }
  }, [id, season_number, episode_number, user]);

  const handleToggleWatched = async () => {
    if (!user) return router.push("/login");

    if (!isWatched && !ignorePrompt) {
      // Find missing previous episodes
      const missingEps = [];
      const sNum = Number(season_number);
      const eNum = Number(episode_number);
      for (let i = 1; i < eNum; i++) {
        if (!watchedEpisodes.some(ep => ep.season === sNum && ep.episode === i)) {
          missingEps.push(i);
        }
      }

      if (missingEps.length > 0) {
        setMissingPreviousEps(missingEps);
        setShowPromptModal(true);
        return;
      }
    }
    
    await proceedToggleEpisode();
  };

  const getEpisodeRuntime = () => {
    if (details?.runtime > 0) return details.runtime;
    if (showDetails?.episode_run_time?.[0] > 0) return showDetails.episode_run_time[0];
    return 0;
  };

  const proceedToggleEpisode = async () => {
    try {
      setIsTogglingWatched(true);
      // Optimistic update
      setIsWatched(!isWatched);
      if (!isWatched) {
        setIsDescriptionRevealed(true); // Reveal description if marked watched
        setWatchedAt(new Date().toISOString());
      } else {
        setWatchedAt(null);
      }
      await api.post("/tracking/watched/episode/toggle", { 
        tmdbId: id, 
        season: Number(season_number), 
        episode: Number(episode_number),
        runtime: getEpisodeRuntime(),
      });
    } catch (error) {
      console.error("Failed to toggle episode watched status:", error);
      setIsWatched(prev => !prev); // revert on error
    } finally {
      setIsTogglingWatched(false);
    }
  };

  const handlePromptAction = async (action: 'yes' | 'no' | 'never') => {
    setShowPromptModal(false);
    const sNum = Number(season_number);
    const eNum = Number(episode_number);
    
    if (action === 'never') {
      setIgnorePrompt(true);
      try {
        await api.post("/tracking/settings/ignore-previous-prompt", { tmdbId: id });
      } catch (err) {}
      await proceedToggleEpisode();
    } else if (action === 'no') {
      await proceedToggleEpisode();
    } else if (action === 'yes') {
      const allToMark = [...missingPreviousEps, eNum];
      setIsTogglingWatched(true);
      setIsWatched(true);
      setIsDescriptionRevealed(true);
      setWatchedEpisodes(prev => {
        const newEps = [...prev];
        for (const ep of allToMark) {
          if (!newEps.some(e => e.season === sNum && e.episode === ep)) {
            newEps.push({ season: sNum, episode: ep });
          }
        }
        return newEps;
      });
      
      try {
        await api.post("/tracking/watched/season/toggle", {
          tmdbId: id,
          season: sNum,
          episodes: allToMark,
          runtime: getEpisodeRuntime(),
        });
      } catch (err) {
        console.error("Failed to bulk mark episodes", err);
      } finally {
        setIsTogglingWatched(false);
      }
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Network Error</h1>
        <p className="text-zinc-400 mb-6">{error}</p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-zinc-800 text-white font-bold rounded hover:bg-zinc-700 transition-colors">
            Retry
          </button>
          <Link href={`/title/tv/${id}`} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors">
            Back to Series
          </Link>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
        <Link href={`/title/tv/${id}`} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors">
          Back to Series
        </Link>
      </div>
    );
  }

  const title = details.name;
  const overview = details.overview;
  const airDate = details.air_date ? new Date(details.air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Air Date';
  const runtime = details.runtime;

  // Derived data
  const directors = details.crew?.filter((c: any) => c.job === "Director") || [];
  const writers = details.crew?.filter((c: any) => c.job === "Writer") || [];
  const guestStars = details.guest_stars || [];
  
  // Deduplicate crew by ID to combine jobs for cleaner display
  const uniqueCrewMap = new Map();
  if (details.crew) {
    details.crew.forEach((c: any) => {
      if (uniqueCrewMap.has(c.id)) {
        const existing = uniqueCrewMap.get(c.id);
        if (!existing.job.includes(c.job)) {
          existing.job += `, ${c.job}`;
        }
      } else {
        uniqueCrewMap.set(c.id, { ...c });
      }
    });
  }
  const uniqueCrew = Array.from(uniqueCrewMap.values());
  
  const stills = details.images?.stills || [];
  const youtubeVideos = details.videos?.results?.filter((v: any) => v.site === "YouTube") || [];

  // Navigation logic
  const currentEpNum = Number(episode_number);
  const totalEpisodes = seasonDetails?.episodes?.length || 0;
  
  const hasPrevious = currentEpNum > 1;
  const hasNext = currentEpNum < totalEpisodes;
  const nextEpisodeData = hasNext ? seasonDetails?.episodes?.find((ep: any) => ep.episode_number === currentEpNum + 1) : null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative overflow-x-hidden pb-12">
      
      {/* Sticky App Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300 flex items-center justify-between h-16 px-4 sm:px-6 border-b ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-white/10 shadow-lg' : 'bg-transparent border-transparent pt-4'}`}>
        <button onClick={() => router.back()} className={`pointer-events-auto shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isScrolled ? 'hover:bg-white/10' : 'bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className={`flex-1 min-w-0 flex flex-col items-center justify-center px-2 sm:px-4 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="font-bold text-sm sm:text-base truncate w-full text-center">
            {showDetails?.name ? `${showDetails.name} • S${season_number} E${episode_number}` : `Season ${season_number} E${episode_number}`}
          </h1>
          <span className="text-[10px] sm:text-xs text-zinc-400 font-medium truncate w-full text-center">
            {title}
          </span>
        </div>
        
        <div className="shrink-0 w-10" /> {/* Empty div to balance the back button */}
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[50vh] sm:h-[60vh]">
        {details.still_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/original${details.still_path}`} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent opacity-80" />

        {/* Floating Watched Button */}
        <div className="absolute inset-0 flex justify-center pointer-events-none z-30 px-4">
          <div className="relative w-full max-w-4xl h-full">
            <div className="absolute top-6 right-0 sm:top-auto sm:bottom-4 sm:right-0 pointer-events-auto inline-flex flex-col items-center group">
            <button
              onClick={handleToggleWatched}
              disabled={isTogglingWatched}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isWatched 
                  ? 'bg-green-500 text-white shadow-green-500/20' 
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/10'
              } ${isTogglingWatched ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
              title={isWatched ? "Mark as unwatched" : "Mark as watched"}
            >
              {isTogglingWatched ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isWatched ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-none">
              <span className="text-xs font-bold tracking-wider text-zinc-400 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap">
                {isWatched ? 'WATCHED' : 'MARK'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>


      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-32 sm:-mt-48 relative z-10 w-full flex flex-col gap-6 sm:gap-10 pb-4">
        <div className="flex flex-col pt-4 sm:pt-16 w-full text-left">
          <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs sm:text-sm mb-2">
            Season {season_number} • Episode {episode_number}
          </p>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">{title}</h1>
          
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-400 mb-6 font-medium">
            {details.vote_average > 0 && (
              <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {details.vote_average.toFixed(1)}
              </div>
            )}
            <div className="flex items-center gap-1.5" title="Original Air Date">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {airDate}
            </div>
            {isWatched && watchedAt && (
              <div className="flex items-center gap-1.5 text-green-400 font-bold" title="Watched On">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {new Date(watchedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            )}
            {runtime > 0 && <span>{runtime} min</span>}
          </div>

          <div className="relative mt-4 max-w-3xl">
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed sm:leading-loose transition-all duration-500 ${!isDescriptionRevealed ? 'text-zinc-500 blur-sm select-none' : 'text-zinc-300'}`}>
              {overview || "No description available."}
            </p>
            {!isDescriptionRevealed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={() => setIsDescriptionRevealed(true)}
                  className="bg-zinc-800/80 hover:bg-zinc-700 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold shadow-xl transition-colors border border-zinc-600"
                >
                  Reveal Spoiler
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/50 pb-6">
            {/* Left side: Where to Watch */}
            {showDetails?.['watch/providers']?.results?.[userCountry]?.flatrate ? (
              <div className="flex-1">
                <h3 className="text-zinc-500 text-xs sm:text-sm font-bold uppercase mb-3">Where to Watch</h3>
                <div className="flex flex-wrap gap-3">
                  {showDetails['watch/providers'].results[userCountry].flatrate.slice(0, 4).map((provider: any) => (
                    <button 
                      key={provider.provider_id} 
                      onClick={(e) => {
                        e.preventDefault();
                        setPendingRedirectLink(getProviderLink(provider.provider_name, title, showDetails['watch/providers'].results[userCountry].link));
                        setPendingProviderName(provider.provider_name);
                      }}
                      title={`Watch on ${provider.provider_name}`} 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-sm border border-zinc-800 hover:scale-110 hover:border-zinc-500 transition-all block shrink-0"
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`} 
                        alt={provider.provider_name} 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : <div className="hidden md:block flex-1" />}

            {/* Right side: Navigation */}
            <div className="flex justify-between md:justify-end items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800/50 shrink-0">
              {/* Previous Button */}
              {hasPrevious ? (
                <Link
                  href={`/title/tv/${id}/season/${season_number}/episode/${currentEpNum - 1}`}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs text-zinc-400 hover:text-white font-bold rounded-full border border-zinc-800/80 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 sm:gap-2 shrink-0 uppercase tracking-widest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Prev</span>
                </Link>
              ) : <div className="w-10 md:hidden" />}

              {/* Compact Up Next Pill */}
              {nextEpisodeData ? (
                <Link 
                  href={`/title/tv/${id}/season/${season_number}/episode/${currentEpNum + 1}`}
                  className="group flex flex-1 md:flex-initial max-w-[280px] sm:max-w-[340px] md:w-[280px] items-center justify-between rounded-full overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-colors shadow-md cursor-pointer ml-auto"
                  replace
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0 w-full">
                    <div className="w-16 h-12 sm:w-20 sm:h-14 shrink-0 bg-zinc-800 relative">
                      {nextEpisodeData.still_path ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${nextEpisodeData.still_path}`} 
                          alt={nextEpisodeData.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 pr-1 py-1">
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest line-clamp-1">Up Next: Ep {currentEpNum + 1}</span>
                      <span className="text-[11px] sm:text-xs text-zinc-200 font-bold truncate group-hover:text-white transition-colors mt-0.5">{nextEpisodeData.name}</span>
                    </div>
                  </div>
                  <div className="shrink-0 pr-3 sm:pr-4 text-zinc-500 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </Link>
              ) : hasNext ? (
                <Link
                  href={`/title/tv/${id}/season/${season_number}/episode/${currentEpNum + 1}`}
                  className="px-5 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base bg-white text-black hover:bg-zinc-200 font-bold rounded-full transition-all flex items-center gap-2 shadow-lg ml-auto"
                  replace
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : <div className="w-10 md:hidden" />}
            </div>
          </div>
        </div>
      </div>

      {/* Guest Stars Section */}
      {guestStars.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 w-full mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Guest Stars
            </h2>
            <div className="flex items-center gap-1 bg-zinc-900/80 rounded-full p-1 border border-zinc-800/80">
              <button onClick={() => scrollContainer(guestStarsRef, 'left')} className="p-1 sm:p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-px h-4 bg-zinc-800"></div>
              <button onClick={() => scrollContainer(guestStarsRef, 'right')} className="p-1 sm:p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div ref={guestStarsRef} className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden snap-x">
            {guestStars.map((person: any) => (
              <Link href={`/person/${person.id}`} key={person.id} className="shrink-0 w-28 sm:w-36 snap-start flex flex-col gap-2 sm:gap-3 group cursor-pointer">
                <div className="aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative shadow-lg">
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w276_and_h350_face${person.profile_path}`}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900/50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <p className="text-white text-xs sm:text-sm font-bold truncate group-hover:text-white transition-colors">{person.name}</p>
                  <p className="text-zinc-500 text-[10px] sm:text-xs truncate" title={person.character}>{person.character}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Crew Section */}
      {uniqueCrew.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 w-full mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Crew
            </h2>
            <div className="flex items-center gap-1 bg-zinc-900/80 rounded-full p-1 border border-zinc-800/80">
              <button onClick={() => scrollContainer(crewRef, 'left')} className="p-1 sm:p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-px h-4 bg-zinc-800"></div>
              <button onClick={() => scrollContainer(crewRef, 'right')} className="p-1 sm:p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div ref={crewRef} className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden snap-x">
            {uniqueCrew.map((person: any) => (
              <Link href={`/person/${person.id}`} key={person.id} className="shrink-0 w-28 sm:w-36 snap-start flex flex-col gap-2 sm:gap-3 group cursor-pointer">
                <div className="aspect-[2/3] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative shadow-lg">
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w276_and_h350_face${person.profile_path}`}
                      alt={person.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900/50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <p className="text-white text-xs sm:text-sm font-bold truncate group-hover:text-white transition-colors">{person.name}</p>
                  <p className="text-zinc-500 text-[10px] sm:text-xs truncate" title={person.job}>{person.job}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos Section */}
      {youtubeVideos.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 w-full mb-12">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white flex items-center gap-2">
            Trailers & Clips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {youtubeVideos.slice(0, 4).map((video: any) => (
              <div key={video.id} className="cursor-pointer relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group" onClick={() => setPlayingVideos(prev => ({...prev, [video.id]: true}))}>
                {playingVideos[video.id] ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.key}?autoplay=1`}
                    title={video.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`} alt={video.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors duration-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all duration-300 pl-0.5 sm:pl-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images Section */}
      {stills.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 w-full mb-12">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white flex items-center gap-2">
            Episode Stills
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden snap-x">
            {stills.map((still: any, idx: number) => (
              <div key={idx} className="shrink-0 w-72 sm:w-80 snap-start">
                <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${still.file_path}`}
                    alt="Episode Still"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setShowPromptModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowPromptModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Mark previous episodes?</h3>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">It looks like you haven't watched all previous episodes in this season. Would you like to mark them as watched?</p>
            <div className="flex justify-end items-center gap-2 font-bold text-[11px] tracking-widest mt-2">
              <button onClick={() => handlePromptAction('never')} className="px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors uppercase">Never</button>
              <button onClick={() => handlePromptAction('no')} className="px-4 py-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors uppercase">No</button>
              <button onClick={() => handlePromptAction('yes')} className="px-4 py-2 text-black bg-white hover:bg-zinc-200 rounded transition-colors uppercase shadow-sm">Mark All</button>
            </div>
          </div>
        </div>
      )}
      {/* Redirect Confirmation Modal */}
      {pendingRedirectLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setPendingRedirectLink(null); }}>
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Leaving TVTrac</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              You are about to be redirected to search on <span className="text-white font-bold">{pendingProviderName}</span>.
            </p>
            <div className="flex justify-end items-center gap-2 font-bold text-[11px] tracking-widest mt-2">
              <button onClick={() => setPendingRedirectLink(null)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors uppercase">Cancel</button>
              <a href={pendingRedirectLink} target="_blank" rel="noopener noreferrer" onClick={() => setPendingRedirectLink(null)} className="px-4 py-2 text-black bg-white hover:bg-zinc-200 rounded-md transition-colors uppercase">Continue</a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
