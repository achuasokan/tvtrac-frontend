'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { profileService } from '@/features/profile/api/profile.service';
import { WatchHistoryItem } from '@/features/profile/types';
import { MediaGrid } from '@/features/profile/components/MediaGrid';

export default function HistoryPage({ params }: { params: { mediaType: string } }) {
    const { user } = useAppSelector(state => state.auth);
    const router = useRouter();
    const unwrappedParams = React.use(params) as any;
    const mediaType = unwrappedParams.mediaType === 'shows' ? 'tv' : 'movie';
    const otherType = mediaType === 'tv' ? 'movies' : 'shows';
    
    const [history, setHistory] = useState<WatchHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }

        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                // Load up to 500 items for the dedicated history page
                const data = await profileService.getWatchHistory(1, 500, mediaType);
                setHistory(data?.items || []);
            } catch (err) {
                console.error('Failed to load watch history', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user, mediaType, router]);

    const items = useMemo(() => {
        return history.map(item => ({ 
            tmdbId: item.tmdbId, 
            mediaType: item.mediaType, 
            watchedAt: item.watchedAt 
        }));
    }, [history]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => router.push('/profile')}
                        className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Watch History</h1>
                        <p className="text-zinc-500 mt-1">All the {mediaType === 'tv' ? 'shows' : 'movies'} you've watched</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <MediaGrid items={items} emptyMessage={`You haven't watched any ${unwrappedParams.mediaType} yet.`} />
                )}
            </div>
        </div>
    );
}
