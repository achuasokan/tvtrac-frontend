'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { MediaCarousel, CarouselItem } from '@/features/profile/components/MediaCarousel';
import { useAppSelector } from '@/store';
import { profileService } from '@/features/profile/api/profile.service';
import { WatchHistoryItem } from '@/features/profile/types';

export default function ProfilePage() {
    const { user } = useAppSelector(state => state.auth);
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoadingHistory(true);
                const data = await profileService.getWatchHistory();
                setHistory(data || []);
            } catch (err) {
                console.error('Failed to load watch history', err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        if (user) {
            fetchHistory();
        }
    }, [user]);

    const favoriteShows = useMemo(() => {
        return (user?.favoriteShows || []).map(id => ({ tmdbId: id, mediaType: 'tv' as const }));
    }, [user]);

    const favoriteMovies = useMemo(() => {
        return (user?.favoriteMovies || []).map(id => ({ tmdbId: id, mediaType: 'movie' as const }));
    }, [user]);

    const historyShows = useMemo(() => {
        return history.filter(h => h.mediaType === 'tv').map(item => ({ tmdbId: item.tmdbId, mediaType: item.mediaType, watchedAt: item.watchedAt }));
    }, [history]);

    const historyMovies = useMemo(() => {
        return history.filter(h => h.mediaType === 'movie').map(item => ({ tmdbId: item.tmdbId, mediaType: item.mediaType, watchedAt: item.watchedAt }));
    }, [history]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <ProfileHeader />
            <div className="w-full pb-20 mt-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                    
                    {isLoadingHistory ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {(historyShows.length > 0 || favoriteShows.length === 0) && (
                                <MediaCarousel 
                                    title="Shows" 
                                    items={historyShows} 
                                    emptyMessage="Start watching shows to build your history."
                                />
                            )}

                            {favoriteShows.length > 0 && (
                                <MediaCarousel 
                                    title={<span className="flex items-center gap-2"><span className="text-red-500 text-xl">❤️</span> Favorite shows</span>} 
                                    items={favoriteShows} 
                                />
                            )}

                            {(historyMovies.length > 0 || favoriteMovies.length === 0) && (
                                <MediaCarousel 
                                    title="Movies" 
                                    items={historyMovies} 
                                    emptyMessage="Start watching movies to build your history."
                                />
                            )}

                            {favoriteMovies.length > 0 && (
                                <MediaCarousel 
                                    title={<span className="flex items-center gap-2"><span className="text-red-500 text-xl">❤️</span> Favorite movies</span>} 
                                    items={favoriteMovies} 
                                />
                            )}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
