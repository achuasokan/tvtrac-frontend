'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import { profileService } from '../api/profile.service';

export const FavoritesGrid = () => {
    const { user } = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();

    if (!user) return null;

    const hasFavorites = (user.favoriteShows && user.favoriteShows.length > 0) || 
                         (user.favoriteMovies && user.favoriteMovies.length > 0);

    const handleRemoveFavorite = async (tmdbId: string, type: 'movies' | 'shows') => {
        try {
            const updatedUser = await profileService.toggleFavorite({ tmdbId, type }, false);
            dispatch(setUser(updatedUser));
        } catch (error) {
            console.error('Failed to remove favorite', error);
        }
    };

    if (!hasFavorites) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
                <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-300">No favorites yet</h3>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">Start adding movies and shows to your favorites to see them here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {/* Movies Section */}
            {user.favoriteMovies && user.favoriteMovies.length > 0 && (
                <div>
                    <h3 className="text-xs md:text-sm font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        Favorite Movies ({user.favoriteMovies.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {user.favoriteMovies.map(id => (
                            <div key={id} className="aspect-[2/3] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative group transition-all duration-300 hover:scale-[1.03] hover:border-slate-700 shadow-md">
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/60 z-0">
                                    <svg className="w-8 h-8 text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <div className="text-slate-400 text-xs font-semibold text-center truncate w-full">
                                        Movie ({id})
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <button 
                                        onClick={() => handleRemoveFavorite(id, 'movies')}
                                        className="text-red-400 bg-red-950/40 p-3 rounded-full hover:bg-red-900/50 hover:text-red-200 transition-all border border-red-900/30 shadow-lg cursor-pointer"
                                        title="Remove from favorites"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shows Section */}
            {user.favoriteShows && user.favoriteShows.length > 0 && (
                <div>
                    <h3 className="text-xs md:text-sm font-bold tracking-wider text-slate-400 uppercase mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        Favorite Shows ({user.favoriteShows.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {user.favoriteShows.map(id => (
                            <div key={id} className="aspect-[2/3] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative group transition-all duration-300 hover:scale-[1.03] hover:border-slate-700 shadow-md">
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/60 z-0">
                                    <svg className="w-8 h-8 text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                    </svg>
                                    <div className="text-slate-400 text-xs font-semibold text-center truncate w-full">
                                        Show ({id})
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <button 
                                        onClick={() => handleRemoveFavorite(id, 'shows')}
                                        className="text-red-400 bg-red-950/40 p-3 rounded-full hover:bg-red-900/50 hover:text-red-200 transition-all border border-red-900/30 shadow-lg cursor-pointer"
                                        title="Remove from favorites"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
