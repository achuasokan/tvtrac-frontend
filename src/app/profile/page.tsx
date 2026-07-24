'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { MediaCarousel } from '@/features/profile/components/MediaCarousel';
import { StatsSection } from '@/features/profile/components/StatsSection';
import { useAppSelector } from '@/store';
import { profileService } from '@/features/profile/api/profile.service';
import { WatchHistoryItem, ProfileStats } from '@/features/profile/types';

// Global module-level caches for instant 0ms back-navigation
let globalHistoryCache: WatchHistoryItem[] | null = null;
let globalStatsCache: ProfileStats | null = null;

export default function ProfilePage() {
    const { user } = useAppSelector(state => state.auth);
    const [history, setHistory] = useState<WatchHistoryItem[]>(() => globalHistoryCache || []);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(() => !globalHistoryCache);
    const [stats, setStats] = useState<ProfileStats | null>(() => globalStatsCache);
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(() => !globalStatsCache);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                if (!globalHistoryCache) setIsLoadingHistory(true);
                const data = await profileService.getWatchHistory();
                const items = data?.items || [];
                globalHistoryCache = items;
                setHistory(items);
            } catch (err) {
                console.error('Failed to load watch history', err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        const fetchStats = async () => {
            try {
                if (!globalStatsCache) setIsLoadingStats(true);
                const data = await profileService.getStats();
                globalStatsCache = data;
                setStats(data);
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setIsLoadingStats(false);
            }
        };

        if (user) {
            fetchHistory();
            fetchStats();
        }
    }, [user]);

    const favoriteShows = useMemo(() => {
        return (user?.favoriteShows || []).map(id => ({ tmdbId: String(id), mediaType: 'tv' as const }));
    }, [user?.favoriteShows]);

    const favoriteMovies = useMemo(() => {
        return (user?.favoriteMovies || []).map(id => ({ tmdbId: String(id), mediaType: 'movie' as const }));
    }, [user?.favoriteMovies]);

    const historyShows = useMemo(() => {
        return history.filter(h => h.mediaType === 'tv').map(item => ({ tmdbId: String(item.tmdbId), mediaType: item.mediaType, watchedAt: item.watchedAt }));
    }, [history]);

    const historyMovies = useMemo(() => {
        return history.filter(h => h.mediaType === 'movie').map(item => ({ tmdbId: String(item.tmdbId), mediaType: item.mediaType, watchedAt: item.watchedAt }));
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
