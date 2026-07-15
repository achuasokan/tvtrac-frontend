'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { MediaCarousel } from '@/features/profile/components/MediaCarousel';
import { StatsSection } from '@/features/profile/components/StatsSection';
import { useAppSelector } from '@/store';
import { profileService } from '@/features/profile/api/profile.service';
import { WatchHistoryItem, ProfileStats } from '@/features/profile/types';

export default function ProfilePage() {
    const { user } = useAppSelector(state => state.auth);
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoadingHistory(true);
                const data = await profileService.getWatchHistory();
                setHistory(data?.items || []);
            } catch (err) {
                console.error('Failed to load watch history', err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        const fetchStats = async () => {
            try {
                setIsLoadingStats(true);
                const data = await profileService.getStats();
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
