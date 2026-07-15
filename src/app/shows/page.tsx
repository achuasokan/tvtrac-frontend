"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { WatchlistShowItem } from '@/components/watchlist/WatchlistShowItem';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { api } from '@/lib/api';

export default function ShowsPage() {
    const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'watchlist' | 'upcoming'>('watchlist');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const [showsData, setShowsData] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [visibleLimit, setVisibleLimit] = useState(24);
    const [loadedCount, setLoadedCount] = useState(0);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!user || user.watchlistShows?.length === 0) {
            setIsLoadingData(false);
            return;
        }

        const fetchNeededShows = async () => {
            const watchlist = user.watchlistShows || [];
            
            // Limit to fetch is either visibleLimit or all (if upcoming)
            const targetLimit = activeTab === 'upcoming' ? watchlist.length : visibleLimit;
            
            const neededIds = watchlist.slice(loadedCount, targetLimit);
            
            if (neededIds.length === 0) {
                if (showsData.length > 0) setIsLoadingData(false);
                return;
            }

            if (loadedCount === 0) {
                setIsLoadingData(true);
            } else {
                setIsLoadingMore(true);
            }
            
            try {
                const promises = neededIds.map(async (tmdbId) => {
                    const [detailsRes, trackingRes] = await Promise.all([
                        api.get(`/tmdb/title/tv/${tmdbId}`),
                        api.get(`/tracking/watched/status/tv/${tmdbId}`).catch(() => ({ data: { watched: false, watchedEpisodes: [] } }))
                    ]);
                    
                    const details = detailsRes.data;
                    const trackedData = trackingRes.data;
                    
                    let seasonDetails = null;
                    if (details.next_episode_to_air) {
                        try {
                            const res = await api.get(`/tmdb/tv/${tmdbId}/season/${details.next_episode_to_air.season_number}`);
                            seasonDetails = res.data;
                        } catch (e) {
                            console.error("Failed to fetch season details", e);
                        }
                    }
                    
                    // Calculate Next Episode
                    let nextEpisodeStr = "Up to date";
                    let nextEpisodeTitle = "";
                    let isUpToDate = false;
                    let nextSeasonNum = undefined;
                    let nextEpisodeNum = undefined;
                    
                    if (details.seasons && details.seasons.length > 0) {
                        const watchedEps = trackedData?.watchedEpisodes || [];
                        let found = false;
                        
                        for (const season of details.seasons) {
                            if (season.season_number === 0) continue;
                            
                            for (let epNum = 1; epNum <= season.episode_count; epNum++) {
                                const isWatched = watchedEps.some((we: any) => we.season === season.season_number && we.episode === epNum);
                                if (!isWatched) {
                                    nextEpisodeStr = `S${String(season.season_number).padStart(2, '0')} | E${String(epNum).padStart(2, '0')}`;
                                    nextEpisodeTitle = `Episode ${epNum}`;
                                    nextSeasonNum = season.season_number;
                                    nextEpisodeNum = epNum;
                                    found = true;
                                    break;
                                }
                            }
                            if (found) break;
                        }
                        
                        if (!found) {
                            isUpToDate = true;
                            if (details.next_episode_to_air) {
                                nextEpisodeStr = `S${String(details.next_episode_to_air.season_number).padStart(2, '0')} | E${String(details.next_episode_to_air.episode_number).padStart(2, '0')}`;
                                nextEpisodeTitle = details.next_episode_to_air.name;
                                isUpToDate = false;
                            }
                        }
                    } else {
                        isUpToDate = true;
                    }

                    let latestWatchDate = new Date(0);
                    if (trackedData?.watchedEpisodes?.length > 0) {
                        latestWatchDate = trackedData.watchedEpisodes.reduce((latest: Date, ep: any) => {
                            if (!ep.watchedAt) return latest;
                            const epDate = new Date(ep.watchedAt);
                            return epDate > latest ? epDate : latest;
                        }, new Date(0));
                    }
                    
                    const daysSinceLastWatch = latestWatchDate.getTime() > 0 
                        ? (new Date().getTime() - latestWatchDate.getTime()) / (1000 * 3600 * 24) 
                        : 0;

                    return {
                        tmdbId,
                        details,
                        seasonDetails,
                        trackedData,
                        nextEpisodeStr,
                        nextEpisodeTitle,
                        nextSeason: nextSeasonNum,
                        nextEpisode: nextEpisodeNum,
                        isUpToDate,
                        hasStarted: (trackedData?.watchedEpisodes || []).length > 0,
                        daysSinceLastWatch
                    };
                });

                const results = await Promise.all(promises);
                setShowsData(prev => {
                    const existingIds = new Set(prev.map(p => p.tmdbId));
                    const newUnique = results.filter(r => !existingIds.has(r.tmdbId));
                    return [...prev, ...newUnique];
                });
                setLoadedCount(prev => prev + neededIds.length);
            } catch (err) {
                console.error("Failed to load watchlist shows data", err);
            } finally {
                setIsLoadingData(false);
                setIsLoadingMore(false);
            }
        };

        fetchNeededShows();
    }, [user?.watchlistShows, refetchTrigger, visibleLimit, activeTab, loadedCount]);

    const hasMore = user && user.watchlistShows && loadedCount < user.watchlistShows.length;

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        if (typeof window !== 'undefined') router.push('/');
        return null;
    }

    const watchlist = user.watchlistShows || [];

    // Categorize
    const haventStarted = showsData.filter(s => !s.hasStarted);
    const haventWatchedForAWhile = showsData.filter(s => s.hasStarted && !s.isUpToDate && s.daysSinceLastWatch > 30);
    const watchNext = showsData.filter(s => s.hasStarted && !s.isUpToDate && s.daysSinceLastWatch <= 30);
    
    // Extract History Episodes
    let historyEpisodes: any[] = [];
    for (const show of showsData) {
        if (show.trackedData?.watchedEpisodes) {
            for (const ep of show.trackedData.watchedEpisodes) {
                historyEpisodes.push({
                    tmdbId: show.tmdbId,
                    details: show.details,
                    trackedData: show.trackedData,
                    nextEpisodeStr: `S${String(ep.season).padStart(2, '0')} | E${String(ep.episode).padStart(2, '0')}`,
                    nextEpisodeTitle: `Episode ${ep.episode}`,
                    nextSeason: ep.season,
                    nextEpisode: ep.episode,
                    isHistoryItem: true,
                    watchedAt: new Date(ep.watchedAt || 0)
                });
            }
        }
    }
    historyEpisodes.sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime());
    historyEpisodes = historyEpisodes.slice(0, 20); // Show last 20 episodes

    // Extract Upcoming Episodes
    const upcomingEpisodesGrouped: { [dateLabel: string]: any[] } = {};
    
    for (const show of showsData) {
        const episodesToProcess: any[] = [];
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);
        
        // Add future episodes from seasonDetails if available
        if (show.seasonDetails?.episodes) {
            for (const ep of show.seasonDetails.episodes) {
                if (!ep.air_date) continue;
                const [year, month, day] = ep.air_date.split('-').map(Number);
                const airDate = new Date(year, month - 1, day);
                
                // Include if it airs today or in the future
                if (airDate.getTime() >= todayAtMidnight.getTime()) {
                    if (!episodesToProcess.some(e => e.episode_number === ep.episode_number && e.season_number === ep.season_number)) {
                        episodesToProcess.push(ep);
                    }
                }
            }
        } else if (show.details?.next_episode_to_air) {
            // Fallback to next_episode_to_air if seasonDetails failed
            episodesToProcess.push(show.details.next_episode_to_air);
        }
        
        // Add last episode if it aired recently (within last 30 days)
        if (show.details?.last_episode_to_air) {
            const [year, month, day] = show.details.last_episode_to_air.air_date.split('-').map(Number);
            const lastAirDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = today.getTime() - lastAirDate.getTime();
            const daysSince = Math.round(diffTime / (1000 * 3600 * 24));
            
            // Only include if it aired in the last 30 days
            if (daysSince >= 0 && daysSince <= 30) {
                // Ensure we don't duplicate if it was already added by seasonDetails
                if (!episodesToProcess.some(e => e.episode_number === show.details.last_episode_to_air.episode_number && e.season_number === show.details.last_episode_to_air.season_number)) {
                    episodesToProcess.push(show.details.last_episode_to_air);
                }
            }
        }
        
        for (const ep of episodesToProcess) {
            // Parse YYYY-MM-DD manually to avoid UTC conversion shifting the day
            const [year, month, day] = ep.air_date.split('-').map(Number);
            const airDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = airDate.getTime() - today.getTime();
            const daysLeft = Math.round(diffTime / (1000 * 3600 * 24));
            
            let dateLabel = "";
            if (daysLeft === 0) {
                dateLabel = "Today";
            } else if (daysLeft === 1) {
                dateLabel = "Tomorrow";
            } else if (daysLeft === -1) {
                dateLabel = "Yesterday";
            } else {
                dateLabel = airDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
            
            if (!upcomingEpisodesGrouped[dateLabel]) {
                upcomingEpisodesGrouped[dateLabel] = [];
            }
            
            upcomingEpisodesGrouped[dateLabel].push({
                ...show,
                nextEpisodeStr: `S${String(ep.season_number).padStart(2, '0')} | E${String(ep.episode_number).padStart(2, '0')}`,
                nextEpisodeTitle: ep.name,
                nextSeason: ep.season_number,
                nextEpisode: ep.episode_number,
                networkName: show.details?.networks?.[0]?.name,
                isUpcomingItem: true,
                daysLeft,
                airDate
            });
        }
    }
    
    // Sort items within each group
    for (const key of Object.keys(upcomingEpisodesGrouped)) {
        upcomingEpisodesGrouped[key].sort((a, b) => a.airDate.getTime() - b.airDate.getTime());
    }

    const getGroupOrder = (label: string) => {
        if (label === "Yesterday") return -1;
        if (label === "Today") return 0;
        if (label === "Tomorrow") return 1;
        return 2; 
    };

    const upcomingGroupKeys = Object.keys(upcomingEpisodesGrouped).sort((a, b) => {
        const dateA = new Date(upcomingEpisodesGrouped[a][0].airDate);
        const dateB = new Date(upcomingEpisodesGrouped[b][0].airDate);
        return dateB.getTime() - dateA.getTime(); // Sort by most recent/future first or ascending? The user probably wants it chronological (past -> future) or future -> past.
    });
    
    // Sort chronological: oldest to newest
    upcomingGroupKeys.sort((a, b) => {
        const dateA = new Date(upcomingEpisodesGrouped[a][0].airDate);
        const dateB = new Date(upcomingEpisodesGrouped[b][0].airDate);
        return dateA.getTime() - dateB.getTime();
    });

    const handleToggleWatched = async (e: React.MouseEvent, tmdbId: string, season: number, episode: number) => {
        e.stopPropagation();
        const toggleKey = `${tmdbId}-${season}-${episode}`;
        setTogglingIds(prev => new Set(prev).add(toggleKey));
        
        const show = showsData.find(s => s.tmdbId === tmdbId);
        const runtime = show?.details?.episode_run_time?.[0] || 0;
        
        try {
            await api.post('/tracking/watched/episode/toggle', {
                tmdbId,
                season,
                episode,
                runtime
            });
            
            // Re-fetch only the tracking data for this show to update UI locally
            const trackingRes = await api.get(`/tracking/watched/status/tv/${tmdbId}`).catch(() => ({ data: { watched: false, watchedEpisodes: [] } }));
            const trackedData = trackingRes.data;
            
            if (show) {
                const details = show.details;
                let nextEpisodeStr = "Up to date";
                let nextEpisodeTitle = "";
                let isUpToDate = false;
                let nextSeasonNum = undefined;
                let nextEpisodeNum = undefined;
                
                if (details.seasons && details.seasons.length > 0) {
                    const watchedEps = trackedData?.watchedEpisodes || [];
                    let found = false;
                    for (const seasonObj of details.seasons) {
                        if (seasonObj.season_number === 0) continue;
                        for (let epNum = 1; epNum <= seasonObj.episode_count; epNum++) {
                            const isWatched = watchedEps.some((we: any) => we.season === seasonObj.season_number && we.episode === epNum);
                            if (!isWatched) {
                                nextEpisodeStr = `S${String(seasonObj.season_number).padStart(2, '0')} | E${String(epNum).padStart(2, '0')}`;
                                nextEpisodeTitle = `Episode ${epNum}`;
                                nextSeasonNum = seasonObj.season_number;
                                nextEpisodeNum = epNum;
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                    if (!found) {
                        isUpToDate = true;
                        if (details.next_episode_to_air) {
                            nextEpisodeStr = `S${String(details.next_episode_to_air.season_number).padStart(2, '0')} | E${String(details.next_episode_to_air.episode_number).padStart(2, '0')}`;
                            nextEpisodeTitle = details.next_episode_to_air.name;
                            isUpToDate = false;
                        }
                    }
                } else {
                    isUpToDate = true;
                }

                let latestWatchDate = new Date(0);
                if (trackedData?.watchedEpisodes?.length > 0) {
                    latestWatchDate = trackedData.watchedEpisodes.reduce((latest: Date, ep: any) => {
                        if (!ep.watchedAt) return latest;
                        const epDate = new Date(ep.watchedAt);
                        return epDate > latest ? epDate : latest;
                    }, new Date(0));
                }
                
                const daysSinceLastWatch = latestWatchDate.getTime() > 0 
                    ? (new Date().getTime() - latestWatchDate.getTime()) / (1000 * 3600 * 24) 
                    : 0;

                setShowsData(prev => prev.map(s => {
                    if (s.tmdbId === tmdbId) {
                        return {
                            ...s,
                            trackedData,
                            nextEpisodeStr,
                            nextEpisodeTitle,
                            nextSeason: nextSeasonNum,
                            nextEpisode: nextEpisodeNum,
                            isUpToDate,
                            hasStarted: (trackedData?.watchedEpisodes || []).length > 0,
                            daysSinceLastWatch
                        };
                    }
                    return s;
                }));
            }
        } catch (error) {
            console.error("Failed to toggle episode", error);
        } finally {
            setTogglingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(toggleKey);
                return newSet;
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
                
                {/* Tabs */}
                <div className="flex justify-center mb-10 pt-4">
                    <div className="flex gap-8">
                        <button 
                            onClick={() => setActiveTab('watchlist')}
                            className={`flex flex-col items-center gap-1 transition-opacity ${activeTab === 'watchlist' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                            <span className="text-[13px] font-bold tracking-widest text-white uppercase">Watch List</span>
                            {activeTab === 'watchlist' && <div className="w-1.5 h-1.5 rounded-full bg-white mt-1"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('upcoming')}
                            className={`flex flex-col items-center gap-1 transition-opacity ${activeTab === 'upcoming' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                            <span className="text-[13px] font-bold tracking-widest text-white uppercase">Upcoming</span>
                            {activeTab === 'upcoming' && <div className="w-1.5 h-1.5 rounded-full bg-white mt-1"></div>}
                        </button>
                    </div>
                </div>

                {/* Header Area */}
                <div className="flex justify-end mb-8 gap-4">
                    
                    {/* View Toggle */}
                    {((activeTab === 'upcoming' && upcomingGroupKeys.length > 0) || (activeTab === 'watchlist' && showsData.length > 0)) && (
                        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 self-start sm:self-auto shrink-0">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                aria-label="Grid View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                aria-label="List View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'watchlist' ? (
                    watchlist.length > 0 ? (
                        isLoadingData ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-10">
                                {watchNext.length > 0 && (
                                    <div>
                                        <div className="flex justify-center mb-4">
                                            <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-800/50 px-4 py-1 rounded-full">
                                                Watch Next
                                            </span>
                                        </div>
                                        <div className={viewMode === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4" : "flex flex-col gap-3"}>
                                            {watchNext.map((show) => (
                                                <WatchlistShowItem 
                                                    key={show.tmdbId} 
                                                    {...show} 
                                                    viewType={viewMode}
                                                    onToggleWatched={(e, season, episode) => handleToggleWatched(e, show.tmdbId, season, episode)}
                                                    isToggling={togglingIds.has(`${show.tmdbId}-${show.nextSeason}-${show.nextEpisode}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {haventWatchedForAWhile.length > 0 && (
                                    <div>
                                        <div className="flex justify-center mb-4">
                                            <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-800/50 px-4 py-1 rounded-full">
                                                Haven't Watched For A While
                                            </span>
                                        </div>
                                        <div className={viewMode === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4" : "flex flex-col gap-3"}>
                                            {haventWatchedForAWhile.map((show) => (
                                                <WatchlistShowItem 
                                                    key={show.tmdbId} 
                                                    {...show} 
                                                    viewType={viewMode}
                                                    onToggleWatched={(e, season, episode) => handleToggleWatched(e, show.tmdbId, season, episode)}
                                                    isToggling={togglingIds.has(`${show.tmdbId}-${show.nextSeason}-${show.nextEpisode}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {haventStarted.length > 0 && (
                                    <div>
                                        <div className="flex justify-center mb-4">
                                            <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-800/50 px-4 py-1 rounded-full">
                                                Haven't Started
                                            </span>
                                        </div>
                                        <div className={viewMode === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4" : "flex flex-col gap-3"}>
                                            {haventStarted.map((show) => (
                                                <WatchlistShowItem 
                                                    key={show.tmdbId} 
                                                    {...show} 
                                                    viewType={viewMode}
                                                    onToggleWatched={(e, season, episode) => handleToggleWatched(e, show.tmdbId, season, episode)}
                                                    isToggling={togglingIds.has(`${show.tmdbId}-${show.nextSeason}-${show.nextEpisode}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {historyEpisodes.length > 0 && (
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            Continue Watching
                                        </h2>
                                        <div className={viewMode === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4" : "flex flex-col gap-2"}>
                                            {historyEpisodes.map((show, index) => (
                                                <WatchlistShowItem 
                                                    key={`history-${show.tmdbId}-${index}`} 
                                                    {...show} 
                                                    viewType={viewMode}
                                                    onToggleWatched={(e, season, episode) => handleToggleWatched(e, show.tmdbId, season, episode)}
                                                    isToggling={togglingIds.has(`${show.tmdbId}-${show.nextSeason}-${show.nextEpisode}`)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasMore && (
                                    <InfiniteScroll 
                                        hasMore={hasMore} 
                                        isLoading={isLoadingMore} 
                                        onLoadMore={() => setVisibleLimit(prev => prev + 24)} 
                                    />
                                )}
                            </div>
                        )
                    ) : (
                        <div className="bg-[#0a0a0a] rounded-2xl p-10 flex flex-col items-center text-center border border-zinc-800/50 mt-10">
                            <div className="w-16 h-16 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Bring your watch history</h2>
                            <p className="text-zinc-400 mb-8 max-w-md">
                                You aren't tracking any shows yet. Add shows to your watchlist to track your progress and see what's up next.
                            </p>
                            <button 
                                onClick={() => router.push('/discover')}
                                className="bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-zinc-200 transition-colors"
                            >
                                Discover Shows
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-10">
                        {upcomingGroupKeys.length > 0 ? (
                            upcomingGroupKeys.map(dateLabel => (
                                <div key={dateLabel}>
                                    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-2">
                                        <div className={`w-2 h-2 rounded-full ${dateLabel === 'Today' ? 'bg-[#4B832B] shadow-[0_0_10px_rgba(75,131,43,0.8)]' : dateLabel === 'Tomorrow' || dateLabel === 'Yesterday' ? 'bg-white' : 'bg-zinc-700'}`} />
                                        <h2 className={`text-sm sm:text-base font-bold tracking-widest ${dateLabel === 'Today' ? 'text-white' : 'text-zinc-300'}`}>
                                            {dateLabel.toUpperCase()}
                                        </h2>
                                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-2" />
                                    </div>
                                    <div className={viewMode === 'grid' ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4" : "flex flex-col gap-3"}>
                                        {upcomingEpisodesGrouped[dateLabel].map((show, index) => (
                                            <WatchlistShowItem 
                                                key={`${show.tmdbId}-${index}`} 
                                                {...show} 
                                                viewType={viewMode}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-zinc-500">Upcoming episodes for your tracked shows will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
