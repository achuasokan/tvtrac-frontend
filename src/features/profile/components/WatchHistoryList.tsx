'use client';

import React, { useEffect, useState } from 'react';
import { profileService } from '../api/profile.service';
import { WatchHistoryItem } from '../types';

export const WatchHistoryList = () => {
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const data = await profileService.getWatchHistory();
                setHistory(data || []);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load watch history');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-red-400 text-sm">
                {error}
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
                <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-300">No watch history</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">Start watching shows and movies to build your history.</p>
            </div>
        );
    }

    const moviesHistory = history.filter(item => item.mediaType === 'movie');
    const tvHistory = history.filter(item => item.mediaType === 'tv');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Movies Watch History Column */}
            <div>
                <h3 className="text-xs md:text-sm font-bold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    Watched Movies ({moviesHistory.length})
                </h3>
                
                {moviesHistory.length === 0 ? (
                    <div className="text-slate-500 text-sm p-6 bg-slate-900/20 border border-slate-800/60 rounded-xl text-center">
                        No movies in history
                    </div>
                ) : (
                    <div className="space-y-4">
                        {moviesHistory.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-all rounded-xl border border-slate-800/80 group">
                                <div className="w-12 h-16 bg-slate-800 border border-slate-700/60 rounded-md shrink-0 flex flex-col items-center justify-center text-[10px] text-slate-500 font-semibold shadow-inner">
                                    <svg className="w-4 h-4 text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    ID: {item.tmdbId}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-slate-500 truncate">
                                            {new Date(item.watchedAt).toLocaleDateString(undefined, { 
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-200 mt-1 truncate group-hover:text-white transition-colors">
                                        Movie ({item.tmdbId})
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TV Shows Watch History Column */}
            <div>
                <h3 className="text-xs md:text-sm font-bold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    Watched Shows ({tvHistory.length})
                </h3>

                {tvHistory.length === 0 ? (
                    <div className="text-slate-500 text-sm p-6 bg-slate-900/20 border border-slate-800/60 rounded-xl text-center">
                        No TV shows in history
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tvHistory.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-all rounded-xl border border-slate-800/80 group">
                                <div className="w-12 h-16 bg-slate-800 border border-slate-700/60 rounded-md shrink-0 flex flex-col items-center justify-center text-[10px] text-slate-500 font-semibold shadow-inner">
                                    <svg className="w-4 h-4 text-slate-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                    </svg>
                                    ID: {item.tmdbId}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs text-slate-500 truncate">
                                            {new Date(item.watchedAt).toLocaleDateString(undefined, { 
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-200 mt-1 truncate group-hover:text-white transition-colors">
                                        TV Show ({item.tmdbId})
                                    </h4>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
