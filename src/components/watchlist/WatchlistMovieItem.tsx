"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface WatchlistMovieItemProps {
    tmdbId: string;
    details: any;
    viewType?: 'grid' | 'list';
    isUpcomingItem?: boolean;
    daysLeft?: number;
}

export function WatchlistMovieItem({ 
    tmdbId, 
    details, 
    viewType = 'grid',
    isUpcomingItem,
    daysLeft
}: WatchlistMovieItemProps) {
    const router = useRouter();

    if (!details) return null;

    if (viewType === 'list') {
        return (
            <div 
                onClick={() => router.push(`/title/movie/${tmdbId}`)}
                className="group cursor-pointer flex items-center justify-between gap-4 py-3 px-4 transition-all duration-500 min-w-0"
            >
                <div className="relative w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/50 shadow-md">
                    {details.poster_path ? (
                        <img 
                            src={`https://image.tmdb.org/t/p/w200${details.poster_path}`} 
                            alt={details.title} 
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
                
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm sm:text-base text-zinc-200 truncate group-hover:text-white transition-colors">
                            {details.title}
                        </h3>
                        {details.release_date && (
                            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium shrink-0">
                                {details.release_date.split('-')[0]}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                        {details.runtime > 0 && (
                            <span className="text-[10px] sm:text-xs font-medium text-zinc-400 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                            </span>
                        )}
                        
                        {details.genres && details.genres.slice(0, 2).map((g: any) => (
                            <span key={g.id} className="text-[10px] sm:text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                                {g.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="shrink-0 pl-2 flex items-center justify-end min-w-[60px]">
                    {isUpcomingItem && daysLeft !== undefined ? (
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
                             `+${daysLeft} DAYS`}
                        </span>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => router.push(`/title/movie/${tmdbId}`)}
            className="group cursor-pointer flex flex-col gap-2 relative"
        >
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
                {details.poster_path ? (
                    <img 
                        src={`https://image.tmdb.org/t/p/w500${details.poster_path}`} 
                        alt={details.title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
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
                    {details.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-zinc-500 font-medium">
                        {details.release_date ? details.release_date.split('-')[0] : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}
