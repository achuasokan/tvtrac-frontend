"use client";

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { WatchlistMovieSection } from '@/components/watchlist/WatchlistMovieSection';
import { UpcomingMovieSection } from '@/components/watchlist/UpcomingMovieSection';

export default function MoviesPage() {
    const { user, isLoading: isAuthLoading } = useSelector((state: RootState) => state.auth);
    const router = useRouter();
    
    const [activeTab, setActiveTab] = useState<'watchlist' | 'upcoming'>('watchlist');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

    const hasMovies = user.watchlistMovies && user.watchlistMovies.length > 0;

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
                    {hasMovies && (
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

                {/* Content */}
                <main>
                    {activeTab === 'watchlist' ? (
                        <WatchlistMovieSection viewMode={viewMode} />
                    ) : (
                        <UpcomingMovieSection viewMode={viewMode} />
                    )}
                </main>

            </div>
        </div>
    );
}
