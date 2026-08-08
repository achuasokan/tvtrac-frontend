'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { MediaCarousel } from '@/features/profile/components/MediaCarousel';
import { StatsSection } from '@/features/profile/components/StatsSection';
import { useAppSelector } from '@/store';
import { profileService } from '@/features/profile/api/profile.service';
import { WatchHistoryItem, ProfileStats } from '@/features/profile/types';

import { useQuery } from '@tanstack/react-query';

export default function ProfilePage() {
    const { user } = useAppSelector(state => state.auth);
    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['profile', 'history'],
        queryFn: async () => {
            const data = await profileService.getWatchHistory();
            return data?.items || [];
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const { data: stats = null, isLoading: isLoadingStats } = useQuery({
        queryKey: ['profile', 'stats'],
        queryFn: () => profileService.getStats(),
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const favoriteShows = useMemo(() => {
        return [...(user?.favoriteShows || [])].reverse().map(id => ({ tmdbId: String(id), mediaType: 'tv' as const }));
    }, [user?.favoriteShows]);

    const favoriteMovies = useMemo(() => {
        return [...(user?.favoriteMovies || [])].reverse().map(id => ({ tmdbId: String(id), mediaType: 'movie' as const }));
    }, [user?.favoriteMovies]);

    const historyShows = useMemo(() => {
        return (history as WatchHistoryItem[]).filter((h: WatchHistoryItem) => h.mediaType === 'tv').map(item => ({ tmdbId: String(item.tmdbId), mediaType: item.mediaType, watchedAt: item.watchedAt }));
    }, [history]);

    const historyMovies = useMemo(() => {
        return (history as WatchHistoryItem[]).filter((h: WatchHistoryItem) => h.mediaType === 'movie').map(item => ({ tmdbId: String(item.tmdbId), mediaType: item.mediaType, watchedAt: item.watchedAt }));
    }, [history]);

    // Prevent flashing empty skeletons while logging out / transitioning
    if (!user) {
        return <div className="min-h-screen bg-[#0a0a0a]" />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <ProfileHeader />
            <div className="w-full pb-20 mt-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">

                    {/* Stats Section */}
                    <StatsSection stats={stats} isLoading={isLoadingStats} />

                    {isLoadingHistory ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <MediaCarousel 
                                title="Shows" 
                                items={historyShows.slice(0, 10)} 
                                emptyMessage="Start watching shows to build your history."
                                viewAllLink="/profile/history/shows"
                            />

                            <MediaCarousel 
                                title="Favorite shows" 
                                items={favoriteShows.slice(0, 10)} 
                                emptyMessage="You haven't added any favorite shows yet."
                                viewAllLink="/profile/favorites/shows"
                            />

                            <MediaCarousel 
                                title="Movies" 
                                items={historyMovies.slice(0, 10)} 
                                emptyMessage="Start watching movies to build your history."
                                viewAllLink="/profile/history/movies"
                            />

                            <MediaCarousel 
                                title="Favorite movies" 
                                items={favoriteMovies.slice(0, 10)} 
                                emptyMessage="You haven't added any favorite movies yet."
                                viewAllLink="/profile/favorites/movies"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
