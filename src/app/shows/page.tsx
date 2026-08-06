"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { WatchlistSection } from '@/components/watchlist/WatchlistSection';
import { UpcomingSection } from '@/components/watchlist/UpcomingSection';

export default function ShowsPage() {
    const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'watchlist' | 'upcoming'>('watchlist');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const queryClient = useQueryClient();

    const handleToggleWatched = async (e: React.MouseEvent, tmdbId: string, season: number, episode: number) => {
        e.stopPropagation();
        
        const toggleKey = `${tmdbId}-${season}-${episode}`;
        setTogglingIds(prev => new Set(prev).add(toggleKey));

        try {
            await api.post('/tracking/watched/episode/toggle', {
                tmdbId,
                season,
                episode,
                runtime: 0 // Ideally this is passed if available
            });
            setRefetchTrigger(prev => prev + 1);
            queryClient.invalidateQueries({ queryKey: ['profile', 'history'] });
        } catch (error) {
            console.error("Failed to toggle watch status", error);
        } finally {
            setTogglingIds(prev => {
                const next = new Set(prev);
                next.delete(toggleKey);
                return next;
            });
        }
    };

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

    const hasShows = user.watchlistShows && user.watchlistShows.length > 0;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-32">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                
                {/* Tabs */}
                <div className="sticky top-0 z-40 bg-[#050505] flex justify-center pt-4 pb-4 mb-4">
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
                <div className="flex justify-end mb-8 gap-4 sticky top-[72px] z-30">
                    {/* View Toggle */}
                    {hasShows && (
                        <div className="flex bg-[#111111] rounded p-0.5 border border-zinc-800/60 self-start sm:self-auto shrink-0 shadow-sm">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1 rounded-[3px] transition-colors ${viewMode === 'grid' ? 'bg-zinc-800/80 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                aria-label="Grid View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1 rounded-[3px] transition-colors ${viewMode === 'list' ? 'bg-zinc-800/80 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                aria-label="List View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <main>
                {activeTab === 'watchlist' ? (
                    hasShows ? (
                        <div className="flex flex-col gap-12">
                            <WatchlistSection 
                                title="Watch Next" 
                                category="watch-next" 
                                viewMode={viewMode} 
                                onToggleWatched={handleToggleWatched} 
                                togglingIds={togglingIds} 
                                refetchTrigger={refetchTrigger}
                            />
                            <WatchlistSection 
                                title="Haven't Watched For A While" 
                                category="havent-watched-for-a-while" 
                                viewMode={viewMode} 
                                onToggleWatched={handleToggleWatched} 
                                togglingIds={togglingIds} 
                                refetchTrigger={refetchTrigger}
                            />
                            <WatchlistSection 
                                title="Haven't Started" 
                                category="havent-started" 
                                viewMode={viewMode} 
                                onToggleWatched={handleToggleWatched} 
                                togglingIds={togglingIds} 
                                refetchTrigger={refetchTrigger}
                            />
                            <WatchlistSection 
                                title="History" 
                                category="history" 
                                viewMode={viewMode} 
                                onToggleWatched={handleToggleWatched} 
                                togglingIds={togglingIds} 
                                refetchTrigger={refetchTrigger}
                            />
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] rounded-2xl p-10 flex flex-col items-center text-center border border-zinc-800/50 mt-10">
                            <div className="w-16 h-16 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Bring your watch history</h2>
                            <p className="text-zinc-400 mb-8 max-w-md">
                                You aren&apos;t tracking any shows yet. Add shows to your watchlist to track your progress and see what&apos;s up next.
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
                    <UpcomingSection viewMode={viewMode} />
                )}
                </main>
            </div>
        </div>
    );
}
