"use client";

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { WatchlistMovieItem } from '@/components/watchlist/WatchlistMovieItem';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { api } from '@/lib/api';

export default function MoviesPage() {
    const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState<'watchlist' | 'upcoming'>('watchlist');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    
    const [moviesData, setMoviesData] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [visibleLimit, setVisibleLimit] = useState(24);
    const [loadedCount, setLoadedCount] = useState(0);

    useEffect(() => {
        if (!user || !user.watchlistMovies || user.watchlistMovies.length === 0) {
            setIsLoadingData(false);
            return;
        }

        const fetchNeededMovies = async () => {
            const watchlist = user.watchlistMovies || [];
            
            // Limit to fetch is either visibleLimit or all (if upcoming)
            const targetLimit = activeTab === 'upcoming' ? watchlist.length : visibleLimit;
            
            const neededIds = watchlist.slice(loadedCount, targetLimit);
            
            if (neededIds.length === 0) return;

            if (loadedCount === 0) {
                setIsLoadingData(true);
            } else {
                setIsLoadingMore(true);
            }

            try {
                const promises = neededIds.map(async (tmdbId) => {
                    try {
                        const res = await api.get(`/tmdb/title/movie/${tmdbId}`);
                        return { tmdbId, details: res.data };
                    } catch (e) {
                        return { tmdbId, details: null };
                    }
                });

                const results = await Promise.all(promises);
                const validResults = results.filter(m => m.details);
                
                setMoviesData(prev => {
                    const existingIds = new Set(prev.map(p => p.tmdbId));
                    const newUnique = validResults.filter(r => !existingIds.has(r.tmdbId));
                    return [...prev, ...newUnique];
                });
                setLoadedCount(prev => prev + neededIds.length);
            } catch (err) {
                console.error("Failed to load watchlist movies data", err);
            } finally {
                setIsLoadingData(false);
                setIsLoadingMore(false);
            }
        };

        fetchNeededMovies();
    }, [user?.watchlistMovies, visibleLimit, activeTab, loadedCount]);

    const hasMore = user && user.watchlistMovies && loadedCount < user.watchlistMovies.length;

    if (isAuthLoading || (isLoadingData && moviesData.length === 0)) {
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

    // Process Upcoming Movies
    const upcomingMoviesGrouped: { [dateLabel: string]: any[] } = {};
    const todayAtMidnight = new Date();
    todayAtMidnight.setHours(0, 0, 0, 0);

    for (const movie of moviesData) {
        if (!movie.details?.release_date) continue;

        const [year, month, day] = movie.details.release_date.split('-').map(Number);
        const releaseDate = new Date(year, month - 1, day);
        
        const diffTime = releaseDate.getTime() - todayAtMidnight.getTime();
        const daysLeft = Math.round(diffTime / (1000 * 3600 * 24));
        
        // Include if it releases in the future, today, or recently (last 30 days)
        if (daysLeft >= -30) {
            let dateLabel = "";
            if (daysLeft === 0) {
                dateLabel = "Today";
            } else if (daysLeft === 1) {
                dateLabel = "Tomorrow";
            } else if (daysLeft === -1) {
                dateLabel = "Yesterday";
            } else {
                dateLabel = releaseDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }
            
            if (!upcomingMoviesGrouped[dateLabel]) {
                upcomingMoviesGrouped[dateLabel] = [];
            }
            
            upcomingMoviesGrouped[dateLabel].push({
                ...movie,
                isUpcomingItem: true,
                daysLeft,
            });
        }
    }

    // Sort upcoming dates chronologically
    const upcomingGroupKeys = Object.keys(upcomingMoviesGrouped).sort((a, b) => {
        const getVal = (lbl: string) => {
            if (lbl === 'Today') return 0;
            if (lbl === 'Tomorrow') return 1;
            if (lbl === 'Yesterday') return -1;
            return Math.round((new Date(lbl).getTime() - todayAtMidnight.getTime()) / (1000 * 3600 * 24));
        };
        return getVal(a) - getVal(b);
    });

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                
                {/* Tabs */}
                <div className="flex justify-center mb-8 pt-4">
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
                    {((activeTab === 'upcoming' && upcomingGroupKeys.length > 0) || (activeTab === 'watchlist' && moviesData.length > 0)) && (
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
                    moviesData.length > 0 ? (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                                    {moviesData.map((movie) => (
                                        <WatchlistMovieItem key={movie.tmdbId} tmdbId={movie.tmdbId} details={movie.details} viewType="grid" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                                    {moviesData.map((movie) => (
                                        <WatchlistMovieItem key={movie.tmdbId} tmdbId={movie.tmdbId} details={movie.details} viewType="list" />
                                    ))}
                                </div>
                            )}
                            {hasMore && (
                                <InfiniteScroll 
                                    hasMore={hasMore} 
                                    isLoading={isLoadingMore} 
                                    onLoadMore={() => setVisibleLimit(prev => prev + 24)} 
                                />
                            )}
                        </>
                    ) : (
                        <div className="bg-[#0a0a0a] rounded-2xl p-10 flex flex-col items-center text-center border border-zinc-800/50 max-w-2xl mx-auto mt-10">
                            <div className="w-16 h-16 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Bring your watch history</h2>
                            <p className="text-zinc-400 mb-8 max-w-md">
                                You aren't tracking any movies yet. Add movies to your watchlist to track your progress and see what's up next.
                            </p>
                            <button 
                                onClick={() => router.push('/discover')}
                                className="bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-zinc-200 transition-colors"
                            >
                                Discover Movies
                            </button>
                        </div>
                    )
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {upcomingGroupKeys.length > 0 ? (
                            upcomingGroupKeys.map(dateLabel => (
                                <div key={dateLabel}>
                                    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-2">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${dateLabel === 'Today' ? 'bg-[#4B832B] shadow-[0_0_10px_rgba(75,131,43,0.8)]' : dateLabel === 'Tomorrow' || dateLabel === 'Yesterday' ? 'bg-white' : 'bg-zinc-700'}`} />
                                        <h2 className={`text-sm sm:text-base font-bold tracking-widest shrink-0 ${dateLabel === 'Today' ? 'text-white' : 'text-zinc-300'}`}>
                                            {dateLabel.toUpperCase()}
                                        </h2>
                                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-2" />
                                    </div>
                                    
                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                                            {upcomingMoviesGrouped[dateLabel].map((movie, index) => (
                                                <WatchlistMovieItem 
                                                    key={`${movie.tmdbId}-${index}`} 
                                                    tmdbId={movie.tmdbId}
                                                    details={movie.details}
                                                    isUpcomingItem={movie.isUpcomingItem}
                                                    daysLeft={movie.daysLeft}
                                                    viewType="grid"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {upcomingMoviesGrouped[dateLabel].map((movie, index) => (
                                                <WatchlistMovieItem 
                                                    key={`${movie.tmdbId}-${index}`} 
                                                    tmdbId={movie.tmdbId}
                                                    details={movie.details}
                                                    isUpcomingItem={movie.isUpcomingItem}
                                                    daysLeft={movie.daysLeft}
                                                    viewType="list"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <p className="text-zinc-500">No upcoming movie releases found for your watchlist.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
