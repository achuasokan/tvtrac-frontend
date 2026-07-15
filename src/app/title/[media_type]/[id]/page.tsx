"use client";

import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AddToListModal } from "@/features/lists/components/AddToListModal";
import { setUser } from "@/store/slices/authSlice";
import { profileService } from "@/features/profile/api/profile.service";

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

function SeasonItem({ 
  tvId, 
  season,
  watchedEpisodes,
  setWatchedEpisodes,
  ignorePrompt,
  setIgnorePrompt,
  user,
  router,
  episodeRuntime
}: { 
  tvId: string, 
  season: any,
  watchedEpisodes: {season: number, episode: number}[],
  setWatchedEpisodes: React.Dispatch<React.SetStateAction<{season: number, episode: number}[]>>,
  ignorePrompt: boolean,
  setIgnorePrompt: React.Dispatch<React.SetStateAction<boolean>>,
  user: any,
  router: any,
  episodeRuntime?: number
}) {
  const storageKey = `tvtrac_expanded_season_${tvId}_${season.season_number}`;
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(storageKey) === 'true';
    }
    return false;
  });
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingSeason, setIsTogglingSeason] = useState(false);
  const [togglingEpisodes, setTogglingEpisodes] = useState<Record<number, boolean>>({});
  
  // Prompt State
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingToggleEp, setPendingToggleEp] = useState<number | null>(null);
  const [missingPreviousEps, setMissingPreviousEps] = useState<number[]>([]);

  useEffect(() => {
    if (expanded && episodes.length === 0) {
      setLoading(true);
      setError(null);
      api.get(`/tmdb/tv/${tvId}/season/${season.season_number}`)
        .then(res => setEpisodes(res.data.episodes || []))
        .catch(err => {
          console.error("Failed to load episodes", err);
          setError("Failed to load episodes. Please try again.");
        })
        .finally(() => setLoading(false));
    }
  }, [expanded, tvId, season.season_number]); // Only runs if expanded is true on mount

  const handleToggle = async () => {
    const newState = !expanded;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, String(newState));
    }
    
    if (newState) {
      if (episodes.length === 0) {
        setLoading(true);
        setError(null);
        try {
          const res = await api.get(`/tmdb/tv/${tvId}/season/${season.season_number}`);
          setEpisodes(res.data.episodes || []);
        } catch (err: any) {
          console.error("Failed to load episodes", err);
          setError("Failed to load episodes. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    }
    setExpanded(newState);
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/tmdb/tv/${tvId}/season/${season.season_number}`);
      setEpisodes(res.data.episodes || []);
    } catch (err: any) {
      console.error("Failed to load episodes", err);
      setError("Failed to load episodes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEpisode = async (e: React.MouseEvent, episodeNumber: number) => {
    e.stopPropagation();
    if (!user) return router.push("/login");

    const seasonNum = season.season_number;
    const isWatched = watchedEpisodes.some(ep => ep.season === seasonNum && ep.episode === episodeNumber);
    
    if (!isWatched && !ignorePrompt) {
      // Find missing previous episodes in the current season
      const missingEps = [];
      for (let i = 1; i < episodeNumber; i++) {
        if (!watchedEpisodes.some(ep => ep.season === seasonNum && ep.episode === i)) {
          missingEps.push(i);
        }
      }
      
      if (missingEps.length > 0) {
        setPendingToggleEp(episodeNumber);
        setMissingPreviousEps(missingEps);
        setShowPromptModal(true);
        return;
      }
    }

    await proceedToggleEpisode(episodeNumber, isWatched);
  };

  const getEpisodeRuntimeForToggle = (episodeNumber: number) => {
    const epData = episodes.find(ep => ep.episode_number === episodeNumber);
    return epData?.runtime || episodeRuntime || 0;
  };

  const proceedToggleEpisode = async (episodeNumber: number, isWatched: boolean) => {
    const seasonNum = season.season_number;
    
    // Optimistic update
    setWatchedEpisodes(prev => 
      isWatched 
        ? prev.filter(ep => !(ep.season === seasonNum && ep.episode === episodeNumber))
        : [...prev, { season: seasonNum, episode: episodeNumber }]
    );
    
    setTogglingEpisodes(prev => ({ ...prev, [episodeNumber]: true }));
    try {
      const res = await api.post("/tracking/watched/episode/toggle", {
        tmdbId: tvId,
        season: seasonNum,
        episode: episodeNumber,
        runtime: getEpisodeRuntimeForToggle(episodeNumber),
      });
      setWatchedEpisodes(res.data.watchedEpisodes);
    } catch (error) {
      console.error("Failed to toggle episode", error);
      // Revert optimistic update
      setWatchedEpisodes(prev => 
        isWatched 
          ? [...prev, { season: seasonNum, episode: episodeNumber }]
          : prev.filter(ep => !(ep.season === seasonNum && ep.episode === episodeNumber))
      );
    } finally {
      setTogglingEpisodes(prev => ({ ...prev, [episodeNumber]: false }));
    }
  };

  const handlePromptAction = async (action: 'yes' | 'no' | 'never') => {
    if (!pendingToggleEp) return;
    const epNum = pendingToggleEp;
    const seasonNum = season.season_number;
    setShowPromptModal(false);
    setPendingToggleEp(null);

    if (action === 'never') {
      setIgnorePrompt(true);
      try {
        await api.post("/tracking/settings/ignore-previous-prompt", { tmdbId: tvId });
      } catch (err) {
        console.error("Failed to save ignore prompt setting", err);
      }
      await proceedToggleEpisode(epNum, false);
    } else if (action === 'no') {
      await proceedToggleEpisode(epNum, false);
    } else if (action === 'yes') {
      const allToMark = [...missingPreviousEps, epNum];
      
      // Optimistic update for all
      setWatchedEpisodes(prev => {
        const newEps = [...prev];
        for (const ep of allToMark) {
          if (!newEps.some(e => e.season === seasonNum && e.episode === ep)) {
            newEps.push({ season: seasonNum, episode: ep });
          }
        }
        return newEps;
      });
      
      setTogglingEpisodes(prev => ({ ...prev, [epNum]: true }));
      try {
        const epData = episodes.find(ep => ep.episode_number === epNum);
        const res = await api.post("/tracking/watched/season/toggle", {
          tmdbId: tvId,
          season: seasonNum,
          episodes: allToMark,
          runtime: epData?.runtime || episodeRuntime || 0,
        });
        setWatchedEpisodes(res.data.watchedEpisodes);
      } catch (err) {
        console.error("Failed to bulk mark episodes", err);
      } finally {
        setTogglingEpisodes(prev => ({ ...prev, [epNum]: false }));
      }
    }
  };

  const handleMarkSeasonWatched = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return router.push("/login");
    
    setIsTogglingSeason(true);
    const seasonNum = season.season_number;
    
    let currentEpisodes = episodes;
    if (currentEpisodes.length === 0) {
      // Must fetch episodes first to get the true episode numbers (vital for Anime where episode numbers are absolute)
      try {
        const res = await api.get(`/tmdb/tv/${tvId}/season/${seasonNum}`);
        currentEpisodes = res.data.episodes || [];
        setEpisodes(currentEpisodes);
      } catch (err) {
        console.error("Failed to fetch episodes to mark season", err);
        setIsTogglingSeason(false);
        return;
      }
    }
    
    const now = new Date();
    const releasedEpisodes = currentEpisodes.filter(ep => ep.air_date && new Date(ep.air_date) <= now);
    const epsNumbers = releasedEpisodes.map(ep => ep.episode_number);
    
    // Optimistic update
    const seasonEps = watchedEpisodes.filter(e => e.season === seasonNum);
    const isFullyWatched = seasonEps.length >= releasedEpisodes.length && releasedEpisodes.length > 0;

    setWatchedEpisodes(prev => {
      if (isFullyWatched) {
        // Clear all episodes for this season in frontend to match backend behavior
        return prev.filter(e => e.season !== seasonNum);
      } else {
        const newEps = [...prev];
        for (const epNum of epsNumbers) {
          if (!newEps.some(e => e.season === seasonNum && e.episode === epNum)) {
            newEps.push({ season: seasonNum, episode: epNum });
          }
        }
        return newEps;
      }
    });

    try {
      const res = await api.post("/tracking/watched/season/toggle", { tmdbId: tvId, season: seasonNum, episodes: epsNumbers, runtime: episodeRuntime || 0 });
      setWatchedEpisodes(res.data.watchedEpisodes);
    } catch (error) {
      console.error("Failed to mark season watched", error);
    } finally {
      setIsTogglingSeason(false);
    }
  };

  return (
    <div className="mb-3 bg-zinc-900/50 rounded-xl overflow-hidden border border-zinc-800">
      <div 
        className="flex items-center p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors relative"
        onClick={handleToggle}
      >
        {season.poster_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} 
            alt={season.name} 
            className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-md mr-4 shadow-sm"
          />
        ) : (
          <div className="w-10 h-14 sm:w-12 sm:h-16 bg-zinc-800 rounded-md mr-4 shadow-sm" />
        )}
        <div className="flex-1 text-left pr-2 sm:pr-4">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            {season.name}
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm">
            {user ? (
              <span className={watchedEpisodes.filter(e => e.season === season.season_number).length === season.episode_count && season.episode_count > 0 ? "text-green-400 font-medium" : "text-white font-medium"}>
                {watchedEpisodes.filter(e => e.season === season.season_number).length} / {season.episode_count}
              </span>
            ) : (
              season.episode_count
            )} Episodes • {season.air_date ? season.air_date.split('-')[0] : 'TBA'}
          </p>
        </div>

        <button 
          onClick={handleMarkSeasonWatched}
          disabled={isTogglingSeason}
          title={(watchedEpisodes.filter(e => e.season === season.season_number).length >= season.episode_count && season.episode_count > 0) ? "Unmark season as watched" : "Mark entire season as watched"}
          className={`cursor-pointer mr-2 sm:mr-3 w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-full transition-colors z-10 group border ${
            (watchedEpisodes.filter(e => e.season === season.season_number).length >= season.episode_count && season.episode_count > 0)
              ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {isTogglingSeason ? (
            <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="text-zinc-500 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {user && season.episode_count > 0 && (() => {
          const seasonWatchedCount = watchedEpisodes.filter(e => e.season === season.season_number).length;
          if (seasonWatchedCount === 0) return null;
          
          const progressPercentage = Math.min(Math.round((seasonWatchedCount / season.episode_count) * 100), 100);
          const isComplete = progressPercentage === 100;
          return (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${isComplete ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'}`} 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
          );
        })()}
      </div>
      
      {expanded && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {episodes.map(ep => {
                const isEpWatched = watchedEpisodes.some(e => e.season === season.season_number && e.episode === ep.episode_number);
                const isToggling = togglingEpisodes[ep.episode_number];
                
                // Calculate if episode is in the future
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                let airDate = null;
                if (ep.air_date) {
                    const [year, month, day] = ep.air_date.split('-').map(Number);
                    airDate = new Date(year, month - 1, day);
                }
                
                const isUnreleased = airDate && airDate > today;
                const daysLeft = isUnreleased && airDate ? Math.round((airDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                
                return (
                <div 
                  key={ep.id} 
                  className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-zinc-800/40 transition-colors cursor-pointer border border-transparent hover:border-zinc-800/50 group"
                  onClick={() => router.push(`/title/tv/${tvId}/season/${season.season_number}/episode/${ep.episode_number}`)}
                >
                  <div className="relative w-24 sm:w-32 shrink-0 aspect-video bg-zinc-800 rounded overflow-hidden">
                    {ep.still_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center text-left min-w-0">
                    <div className="flex justify-between items-center w-full">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white transition-colors line-clamp-2">{ep.episode_number}. {ep.name}</h4>
                        {ep.runtime > 0 && <p className="text-[10px] sm:text-xs font-medium text-zinc-500 mt-0.5">{ep.runtime} min</p>}
                      </div>
                      
                      {isUnreleased ? (
                        <div className="shrink-0 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs font-bold text-white tracking-widest uppercase whitespace-nowrap">
                            {daysLeft === 0 ? 'Today' : `${daysLeft} Days`}
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => handleToggleEpisode(e, ep.episode_number)}
                          disabled={isToggling}
                          className={`cursor-pointer ml-2 sm:ml-3 w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-full transition-colors border ${
                            isEpWatched 
                              ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' 
                              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:bg-zinc-700 hover:text-white'
                          }`}
                        >
                          {isToggling ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : isEpWatched ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )})}

              {episodes.length === 0 && !loading && !error && (
                <p className="text-sm text-zinc-500 italic">No episodes available.</p>
              )}
              {error && !loading && (
                <div className="flex flex-col items-center justify-center p-4">
                  <p className="text-sm text-red-400 mb-2">{error}</p>
                  <button 
                    onClick={handleRetry}
                    className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-xs font-bold transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setShowPromptModal(false); setPendingToggleEp(null); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => { setShowPromptModal(false); setPendingToggleEp(null); }}
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
    </div>
  );
}

export default function TitleDetailsPage() {
  const dispatch = useDispatch();
  const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const mediaType = params.media_type as string;
  const id = params.id as string;
  
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const isFavorite = user ? (mediaType === 'tv' ? user.favoriteShows?.includes(id.toString()) : user.favoriteMovies?.includes(id.toString())) : false;

  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  
  const initialTab = (searchParams.get('tab') as any) || 'about';
  const [activeTab, setActiveTab] = useState<'about' | 'episodes' | 'cast' | 'trailers'>(initialTab);

  const handleTabChange = (tab: 'about' | 'episodes' | 'cast' | 'trailers') => {
    setActiveTab(tab);
    router.replace(`/title/${mediaType}/${id}?tab=${tab}`, { scroll: false });
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({});
  const [isWatched, setIsWatched] = useState(false);
  const [watchedEpisodes, setWatchedEpisodes] = useState<{season: number, episode: number}[]>([]);
  const [ignorePrompt, setIgnorePrompt] = useState(false);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);
  const [userCountry, setUserCountry] = useState("US");
  const [pendingRedirectLink, setPendingRedirectLink] = useState<string | null>(null);
  const [pendingProviderName, setPendingProviderName] = useState<string | null>(null);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const initialMount = useRef(true);
  const prevWatchedCount = useRef(0);

  useEffect(() => {
    if (initialMount.current) {
      if (details) {
        initialMount.current = false;
        prevWatchedCount.current = watchedEpisodes.length;
      }
      return;
    }

    if (mediaType === 'tv' && details?.number_of_episodes > 0) {
      const isComplete = watchedEpisodes.length === details.number_of_episodes;
      const wasComplete = prevWatchedCount.current === details.number_of_episodes;

      if (isComplete && !wasComplete && watchedEpisodes.length > 0) {
        if (typeof window !== 'undefined') {
          if (!(window as any).confetti) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            script.onload = () => {
              (window as any).confetti({
                particleCount: 200,
                spread: 120,
                origin: { y: 0.4 },
                colors: ['#22c55e', '#ffffff', '#eab308', '#3b82f6'],
                zIndex: 99999
              });
            };
            document.body.appendChild(script);
          } else {
            (window as any).confetti({
              particleCount: 200,
              spread: 120,
              origin: { y: 0.4 },
              colors: ['#22c55e', '#ffffff', '#eab308', '#3b82f6'],
              zIndex: 99999
            });
          }
        }
      }
      
      prevWatchedCount.current = watchedEpisodes.length;
    }
  }, [watchedEpisodes.length, details?.number_of_episodes, mediaType, details]);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    const fetchDetails = async (retryCount = 0) => {
      try {
        if (retryCount === 0) {
          setIsLoading(true);
          setErrorStatus(null);
        }
        
        const [detailsRes, watchedRes] = await Promise.all([
          api.get(`/tmdb/title/${mediaType}/${id}`),
          user ? api.get(`/tracking/watched/status/${mediaType}/${id}`).catch(() => ({ data: { watched: false, watchedEpisodes: [] } })) : Promise.resolve({ data: { watched: false, watchedEpisodes: [] } })
        ]);
        
        setDetails(detailsRes.data);
        setIsWatched(watchedRes.data.watched);
        if (watchedRes.data.watchedEpisodes) {
          setWatchedEpisodes(watchedRes.data.watchedEpisodes);
        }
        if (watchedRes.data.ignorePreviousEpisodesPrompt !== undefined) {
          setIgnorePrompt(watchedRes.data.ignorePreviousEpisodesPrompt);
        }
        
        setIsLoading(false);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setErrorStatus(404);
          setIsLoading(false);
          return;
        }
        
        console.error(`Failed to fetch details (Attempt ${retryCount + 1}):`, error);
        if (retryCount < 2) {
          setTimeout(() => fetchDetails(retryCount + 1), 1500);
        } else {
          setErrorStatus(500);
          setIsLoading(false);
        }
      }
    };

    if (mediaType && id && (!isAuthLoading || user?.id)) {
      fetchDetails();
    }
  }, [mediaType, id, isAuthLoading, user?.id]);

  const handleToggleWatched = async () => {
    if (!user) return router.push("/login");
    setIsTogglingWatched(true);
    try {
      const res = await api.post(`/tracking/watched/toggle`, {
        tmdbId: id,
        mediaType,
        runtime: details.runtime || 0,
      });
      setIsWatched(res.data.watched);
      if (mediaType === 'tv') {
        setWatchedEpisodes(res.data.watchedEpisodes || []);
      }
    } catch (error) {
      console.error("Failed to toggle watched status", error);
    } finally {
      setIsTogglingWatched(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return router.push("/login");
    setIsTogglingFavorite(true);
    try {
      const updatedUser = await profileService.toggleFavorite(
        { 
          type: mediaType === 'tv' ? 'shows' : 'movies', 
          tmdbId: id.toString() 
        } as any, 
        !isFavorite
      );
      dispatch(setUser(updatedUser));
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (isAuthLoading || !user || isLoading) {
    return (
      <div className="flex-1 flex flex-col relative min-h-screen bg-[#050505] animate-pulse pb-24 font-sans">
        {/* Skeleton Sticky App Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 sm:px-6 pt-4">
          <div className="w-10 h-10 bg-zinc-900 rounded-full" />
          <div className="w-10 h-10 bg-zinc-900 rounded-full" />
        </div>

        {/* Skeleton Hero Section */}
        <div className="relative w-full h-[50vh] sm:h-[60vh] bg-zinc-900">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        </div>

        {/* Skeleton Content */}
        <div className="max-w-4xl mx-auto px-4 -mt-32 sm:-mt-48 relative z-10 w-full flex flex-col items-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center text-center pt-4 sm:pt-16 w-full px-2 sm:px-24">
            <div className="w-3/4 sm:w-1/2 h-10 sm:h-14 bg-zinc-800/80 rounded-lg mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-5 bg-zinc-800/80 rounded" />
              <div className="w-12 h-5 bg-zinc-800/80 rounded" />
              <div className="w-16 h-5 bg-zinc-800/80 rounded" />
            </div>
          </div>
          
          <div className="w-full flex gap-4 px-2 sm:px-0">
            <div className="w-20 h-10 bg-zinc-800/80 rounded" />
            <div className="w-20 h-10 bg-zinc-800/80 rounded" />
            <div className="w-20 h-10 bg-zinc-800/80 rounded" />
          </div>

          <div className="w-full flex flex-col gap-4 mt-8">
            <div className="w-full h-4 bg-zinc-800/60 rounded" />
            <div className="w-[90%] h-4 bg-zinc-800/60 rounded" />
            <div className="w-[80%] h-4 bg-zinc-800/60 rounded" />
            <div className="w-[85%] h-4 bg-zinc-800/60 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (errorStatus === 404) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2">Title Not Found</h2>
        <p className="text-zinc-500 mb-8">This movie or TV show doesn't seem to exist.</p>
        <button onClick={() => router.push('/discover')} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg">
          Browse Library
        </button>
      </div>
    );
  }

  if (errorStatus === 500) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold mb-2 text-center">Connection Failed</h2>
        <p className="text-zinc-400 mb-8 max-w-sm text-center">TMDB servers are currently overloaded. Please try again in a moment.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!details) return null;

  const title = details.title || details.name;
  const releaseYear = details.release_date ? details.release_date.split('-')[0] : (details.first_air_date ? details.first_air_date.split('-')[0] : '');
  const duration = mediaType === 'movie' 
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}`;

  return (
    <main className="flex-1 flex flex-col relative min-h-screen bg-[#050505] text-white pb-24 font-sans">
      
      {/* Sticky App Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center justify-between h-16 px-4 sm:px-6 border-b ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-white/10 shadow-lg' : 'bg-transparent border-transparent pt-4'}`}>
        <button onClick={() => router.back()} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isScrolled ? 'hover:bg-white/10' : 'bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className={`flex-1 text-center font-bold text-lg px-4 truncate transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          {title}
        </h1>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${isScrolled ? 'hover:bg-white/10' : 'bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
          
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                <button 
                  onClick={() => { setIsAddToListModalOpen(true); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-zinc-300 hover:text-white transition-colors font-medium cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to List
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[50vh] sm:h-[60vh]">
        {details.backdrop_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
            alt={title}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        
        {/* Floating Actions over cover photo */}
        <div className="absolute inset-0 max-w-4xl mx-auto pointer-events-none z-30">
          <div className="absolute top-20 right-4 sm:top-auto sm:bottom-16 sm:right-4 pointer-events-auto flex flex-col items-center gap-3">
            
            {/* Floating Favorite Button */}
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(); }}
              disabled={isTogglingFavorite}
              className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-300 shadow-2xl hover:scale-110 group backdrop-blur-md cursor-pointer ${
                isFavorite 
                  ? 'bg-red-500/30 border border-red-500/50 hover:bg-red-500/40' 
                  : 'bg-black/60 border border-white/20 hover:bg-black/80 hover:border-white/40'
              }`}
            >
              {isTogglingFavorite ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isFavorite ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>

            {/* Floating Watched Button (Movies Only) */}
            {mediaType === 'movie' && (
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleWatched(); }}
                disabled={isTogglingWatched}
                className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all duration-300 shadow-2xl hover:scale-110 group backdrop-blur-md cursor-pointer ${
                  isWatched 
                    ? 'bg-green-500/30 border border-green-500/50 hover:bg-green-500/40' 
                    : 'bg-black/60 border border-white/20 hover:bg-black/80 hover:border-white/40'
                } cursor-pointer`}
                title={isWatched ? "Mark as unwatched" : "Mark as watched"}
              >
                {isTogglingWatched ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin text-white" />
                ) : isWatched ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 drop-shadow-md" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-colors drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-32 sm:-mt-48 relative z-10 w-full flex flex-col items-center gap-6 sm:gap-10">
        
        {/* Info */}
        <div className="flex flex-col items-center text-center pt-4 sm:pt-16 w-full px-2 sm:px-24">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2">{title}</h1>
          
          <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-zinc-400 mb-6 font-medium">
            {details.vote_average > 0 && (
              <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {details.vote_average.toFixed(1)}
              </div>
            )}
            <span>{releaseYear}</span>
            <span>{duration}</span>
            {details.status && (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-300">
                {details.status === 'Returning Series' ? 'Ongoing' : details.status}
              </span>
            )}
          </div>
          {/* Spacer to push tabs down where the button used to be */}
          <div className="h-6" />

          {/* Tabs */}
          <div className="sticky top-16 z-40 w-[calc(100%+2rem)] -mx-4 sm:w-full sm:mx-0 mb-8">
            {/* Series Progress Line */}
            {mediaType === 'tv' && details.number_of_episodes > 0 && watchedEpisodes.length > 0 && (() => {
              const progressPercentage = Math.min(Math.round((watchedEpisodes.length / details.number_of_episodes) * 100), 100);
              const isComplete = progressPercentage === 100;
              return (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10 z-50">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isComplete ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'}`} 
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </div>
              );
            })()}
            
            <div className="bg-[#050505]/95 backdrop-blur-xl pt-2 flex justify-between sm:justify-center border-b border-zinc-800 w-full px-1 sm:px-0">
              <button 
                className={`py-2.5 px-1 xs:px-2 sm:py-3 sm:px-6 font-bold text-[10px] xs:text-xs sm:text-sm tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${activeTab === 'about' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => handleTabChange('about')}
              >
                About
              </button>
              {mediaType === 'tv' && (
                <button 
                  className={`py-2.5 px-1 xs:px-2 sm:py-3 sm:px-6 font-bold text-[10px] xs:text-xs sm:text-sm tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${activeTab === 'episodes' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => handleTabChange('episodes')}
                >
                  Episodes
                </button>
              )}
              <button 
                className={`py-2.5 px-1 xs:px-2 sm:py-3 sm:px-6 font-bold text-[10px] xs:text-xs sm:text-sm tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${activeTab === 'cast' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                onClick={() => handleTabChange('cast')}
              >
                Cast & Crew
              </button>
              {details.videos?.results?.some((v: any) => v.site === "YouTube") && (
                <button 
                  className={`py-2.5 px-1 xs:px-2 sm:py-3 sm:px-6 font-bold text-[10px] xs:text-xs sm:text-sm tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer flex-1 sm:flex-none text-center ${activeTab === 'trailers' ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  onClick={() => handleTabChange('trailers')}
                >
                  Trailers
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === 'about' && (
              <div className="animate-in fade-in duration-300 flex flex-col items-center">
                <p className="text-zinc-300 text-base leading-relaxed max-w-3xl mb-8 mt-4">
                  {details.overview}
                </p>

                <div className="flex justify-center flex-wrap gap-2 mb-10">
                  {details.genres?.map((g: any) => (
                    <span key={g.id} className="text-xs font-semibold px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                      {g.name}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 sm:gap-8 mb-4">
                  {(() => {
                    // Extract precise crew members from TMDB credits
                    const getCrew = (jobs: string[], departments: string[] = []) => {
                      if (!details.credits?.crew) return '';
                      let matches = details.credits.crew.filter((c: any) => jobs.includes(c.job));
                      if (matches.length === 0 && departments.length > 0) {
                        matches = details.credits.crew.filter((c: any) => departments.includes(c.department));
                      }
                      // Use a Set to remove duplicate names
                      return Array.from(new Set(matches.map((c: any) => c.name))).join(', ');
                    };

                    const director = mediaType === 'tv' 
                      ? details.created_by?.map((c: any) => c.name).join(', ')
                      : getCrew(['Director']);
                      
                    const writer = getCrew(['Screenplay', 'Writer', 'Story', 'Author'], ['Writing']);
                    const composer = getCrew(['Original Music Composer', 'Music']);
                    const dop = getCrew(['Director of Photography', 'Cinematography']);
                    
                    const originalLangCode = details.original_language;
                    const matchedLang = details.spoken_languages?.find((l: any) => l.iso_639_1 === originalLangCode) || details.spoken_languages?.[0];
                    const language = matchedLang?.english_name || originalLangCode?.toUpperCase();
                    
                    const origin = details.production_countries?.[0]?.name || details.origin_country?.[0];
                    
                    // TMDB sometimes has broken numbers like '10' for budget, so we ensure it's > 1000 before showing
                    const budget = mediaType === 'movie' && details.budget > 1000 ? `$${details.budget.toLocaleString()}` : null;
                    const revenue = mediaType === 'movie' && details.revenue > 1000 ? `$${details.revenue.toLocaleString()}` : null;
                    const studios = details.production_companies?.slice(0, 3).map((c: any) => c.name).join(', ');

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-5 gap-x-4 sm:gap-x-6 max-w-4xl mx-auto w-full px-4 mt-6 mb-4">
                        {director && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">{mediaType === 'tv' ? 'Creator' : 'Director'}</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{director}</span>
                          </div>
                        )}
                        {writer && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Writer</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{writer}</span>
                          </div>
                        )}
                        {composer && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Music</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{composer}</span>
                          </div>
                        )}
                        {dop && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Cinematography</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{dop}</span>
                          </div>
                        )}
                        {language && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Language</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{language}</span>
                          </div>
                        )}
                        {origin && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Origin</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{origin}</span>
                          </div>
                        )}
                        {budget && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Budget</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{budget}</span>
                          </div>
                        )}
                        {revenue && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">Box Office</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{revenue}</span>
                          </div>
                        )}
                        {studios && (
                          <div className="flex flex-col pl-3 border-l-[1.5px] border-zinc-800/80 sm:col-span-2 md:col-span-4 lg:col-span-2">
                            <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold mb-1">{mediaType === 'tv' ? 'Networks' : 'Studios'}</span>
                            <span className="text-zinc-200 text-xs sm:text-[13px] font-medium leading-snug">{studios}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {details['watch/providers']?.results?.[userCountry]?.flatrate && (
                    <div className="flex flex-col items-center mt-2">
                      <span className="block text-zinc-500 font-bold mb-4 uppercase tracking-widest text-[10px]">Available On</span>
                      <div className="flex flex-wrap justify-center items-center gap-4">
                        {details['watch/providers'].results[userCountry].flatrate.map((provider: any) => (
                          <button 
                            key={provider.provider_id} 
                            onClick={(e) => {
                              e.preventDefault();
                              setPendingRedirectLink(getProviderLink(provider.provider_name, title, details['watch/providers'].results[userCountry].link));
                              setPendingProviderName(provider.provider_name);
                            }}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shadow-2xl border border-white/10 hover:scale-110 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all block group"
                            title={`Watch on ${provider.provider_name}`}
                          >
                            <img src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} alt={provider.provider_name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {details.similar?.results?.length > 0 && (
                  <div className="mt-4 border-t border-zinc-800 pt-6 w-full text-center">
                    <h3 className="text-xl font-bold text-white mb-6">You Might Also Like</h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {details.similar.results.map((item: any) => (
                        <div key={item.id} className="w-32 sm:w-36 shrink-0 cursor-pointer group flex flex-col" onClick={() => router.push(`/title/${item.media_type || mediaType}/${item.id}`)}>
                          <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-2.5 transition-transform group-hover:scale-105 group-hover:border-zinc-500 shadow-md">
                            {item.poster_path ? (
                              <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600 text-[10px] uppercase">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs font-bold text-zinc-300 line-clamp-2 text-center leading-snug group-hover:text-white transition-colors">{item.title || item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'episodes' && mediaType === 'tv' && (
              <div className="animate-in fade-in duration-300 flex flex-col">
                {details.seasons?.filter((s: any) => s.season_number > 0).map((season: any) => (
                  <SeasonItem 
                    key={season.id} 
                    tvId={id} 
                    season={season} 
                    watchedEpisodes={watchedEpisodes}
                    setWatchedEpisodes={setWatchedEpisodes}
                    ignorePrompt={ignorePrompt}
                    setIgnorePrompt={setIgnorePrompt}
                    user={user}
                    router={router}
                    episodeRuntime={details?.episode_run_time?.[0] || 0}
                  />
                ))}
              </div>
            )}

            {activeTab === 'cast' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-white mb-6">Cast</h2>
                {details.credits?.cast?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
                    {details.credits.cast.map((actor: any) => (
                      <Link href={`/person/${actor.id}`} key={actor.id} className="text-center group block cursor-pointer">
                        <div className="w-full aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-zinc-900 border border-zinc-800 transition-transform group-hover:scale-105 group-hover:border-zinc-500 shadow-md">
                          {actor.profile_path ? (
                            <img src={`https://image.tmdb.org/t/p/w300${actor.profile_path}`} alt={actor.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{actor.name}</p>
                        <p className="text-xs text-zinc-500 truncate" title={actor.character}>{actor.character}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 mb-12">No cast information available.</p>
                )}

                <h2 className="text-xl font-bold text-white mb-6">Crew</h2>
                {(() => {
                  const uniqueCrewMap = new Map();
                  if (details.credits?.crew) {
                    details.credits.crew.forEach((c: any) => {
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

                  return uniqueCrew.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {uniqueCrew.map((person: any) => (
                        <Link href={`/person/${person.id}`} key={person.id} className="text-center group block cursor-pointer">
                          <div className="w-full aspect-[2/3] rounded-xl overflow-hidden mb-3 bg-zinc-900 border border-zinc-800 transition-transform group-hover:scale-105 group-hover:border-zinc-500 shadow-md">
                            {person.profile_path ? (
                              <img src={`https://image.tmdb.org/t/p/w300${person.profile_path}`} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{person.name}</p>
                          <p className="text-xs text-zinc-500 truncate" title={person.job}>{person.job}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500">No crew information available.</p>
                  );
                })()}
              </div>
            )}

            {activeTab === 'trailers' && (
              <div className="animate-in fade-in duration-300">
                {details.videos?.results?.filter((v: any) => v.site === "YouTube").length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {details.videos.results.filter((v: any) => v.site === "YouTube").map((video: any) => (
                      <div key={video.id} className="flex flex-col gap-2">
                        <div className="cursor-pointer aspect-video w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative group" onClick={() => setPlayingVideos(prev => ({...prev, [video.id]: true}))}>
                          {playingVideos[video.id] ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${video.key}?autoplay=1`}
                              title={video.name}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
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
                        <p className="text-sm font-bold text-white truncate">{video.name}</p>
                        <p className="text-xs text-zinc-500">{video.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500">No trailers available.</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
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

      {/* Add To List Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        tmdbId={id}
        mediaType={mediaType as 'movie' | 'tv'}
      />
    </main>
  );
}
