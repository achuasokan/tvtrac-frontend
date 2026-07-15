"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface WatchlistShowItemProps {
    tmdbId: string;
    details: any;
    trackedData: any;
    nextEpisodeStr: string;
    nextEpisodeTitle?: string;
    nextSeason?: number;
    nextEpisode?: number;
    isHistoryItem?: boolean;
    isUpcomingItem?: boolean;
    daysLeft?: number;
    airDate?: Date;
    onToggleWatched?: (e: React.MouseEvent, season: number, episode: number) => void;
    isToggling?: boolean;
    viewType?: 'grid' | 'list';
}

export function WatchlistShowItem({ tmdbId, details, trackedData, nextEpisodeStr, nextEpisodeTitle, nextSeason, nextEpisode, isHistoryItem, isUpcomingItem, daysLeft, airDate, networkName, onToggleWatched, isToggling, viewType = 'list' }: WatchlistShowItemProps) {
    const router = useRouter();
    const [optimisticMarked, setOptimisticMarked] = React.useState(false);

    React.useEffect(() => {
        setOptimisticMarked(false);
    }, [nextSeason, nextEpisode]);

    if (!details) return null;

    if (viewType === 'grid') {
        return (
            <div 
                onClick={() => {
                    if (nextSeason !== undefined && nextEpisode !== undefined) {
                        router.push(`/title/tv/${tmdbId}/season/${nextSeason}/episode/${nextEpisode}`);
                    } else {
                        router.push(`/title/tv/${tmdbId}`);
                    }
                }}
                className="group cursor-pointer flex flex-col gap-2 relative"
            >
                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
                    {details.poster_path ? (
                        <img 
                            src={`https://image.tmdb.org/t/p/w500${details.poster_path}`} 
                            alt={details.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    {isUpcomingItem && daysLeft !== undefined && (
                        <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                            <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-md border bg-black/80 backdrop-blur-sm ${
                                daysLeft === 0 
                                    ? 'border-[#4B832B] text-[#4B832B]' 
                                    : daysLeft === 1 || daysLeft === -1
                                    ? 'border-white text-white'
                                    : 'border-zinc-600 text-zinc-400'
                            }`}>
                                {daysLeft === 0 ? 'Today' : 
                                 daysLeft === 1 ? 'Tmrw' : 
                                 daysLeft === -1 ? 'Ystrdy' : 
                                 `+${daysLeft} DAYS`}
                            </span>
                        </div>
                    )}
                </div>
                
                <div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
                        {details.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-zinc-400 font-medium truncate">
                            {nextEpisodeStr}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => {
                if (nextSeason !== undefined && nextEpisode !== undefined) {
                    router.push(`/title/tv/${tmdbId}/season/${nextSeason}/episode/${nextEpisode}`);
                } else {
                    router.push(`/title/tv/${tmdbId}`);
                }
            }}
            className={`flex items-center justify-between gap-4 py-3 px-4 rounded-xl transition-all duration-500 cursor-pointer group ${
                optimisticMarked 
                    ? 'bg-[#4B832B]/30 border border-[#4B832B] opacity-50 scale-[0.98]' 
                    : ''
            }`}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-zinc-800 relative shadow-md">
                    {details.poster_path ? (
                        <img 
                            src={`https://image.tmdb.org/t/p/w200${details.poster_path}`} 
                            alt={details.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center py-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span 
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/title/tv/${tmdbId}`);
                            }}
                            className="text-[10px] font-bold tracking-widest text-white uppercase border border-zinc-700 hover:border-white rounded-full px-2 py-0.5 whitespace-nowrap cursor-pointer transition-colors"
                        >
                            {details.name}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-zinc-200">
                            {nextEpisodeStr}
                        </h3>
                    </div>
                    
                    {nextEpisodeTitle && (
                        <p className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">
                            {nextEpisodeTitle}
                        </p>
                    )}
                    {networkName && isUpcomingItem && (
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            {networkName}
                        </p>
                    )}
                </div>
            </div>

            <div className="shrink-0 pl-2 flex items-center justify-end min-w-[60px]">
                {isUpcomingItem ? (
                    <span className={`text-[10px] sm:text-[11px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border ${
                        daysLeft === 0 
                            ? 'border-[#4B832B] text-[#4B832B] bg-[#4B832B]/10 shadow-[0_0_15px_rgba(75,131,43,0.15)]' 
                            : daysLeft === 1 || daysLeft === -1
                            ? 'border-white text-white bg-white/5'
                            : 'border-zinc-800 text-zinc-500 bg-transparent'
                    }`}>
                        {daysLeft === 0 ? 'Today' : 
                         daysLeft === 1 ? 'Tmrw' : 
                         daysLeft === -1 ? 'Ystrdy' : 
                         daysLeft !== undefined && daysLeft < -1 && airDate ? airDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                         `+${daysLeft} DAYS`}
                    </span>
                ) : (
                    <button 
                        disabled={isToggling || optimisticMarked || nextSeason === undefined || nextEpisode === undefined}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleWatched && nextSeason !== undefined && nextEpisode !== undefined) {
                                if (!isHistoryItem) {
                                    setOptimisticMarked(true);
                                    setTimeout(() => {
                                        onToggleWatched(e, nextSeason, nextEpisode);
                                    }, 500); // Let the animation play before removing
                                } else {
                                    onToggleWatched(e, nextSeason, nextEpisode);
                                }
                            }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isHistoryItem || optimisticMarked
                                ? 'bg-[#4B832B] text-white hover:bg-[#3D6E21]' 
                                : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                    >
                        {isToggling ? (
                            <div className={`w-4 h-4 border-2 rounded-full border-t-transparent animate-spin ${isHistoryItem || optimisticMarked ? 'border-white' : 'border-black'}`}></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
