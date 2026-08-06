'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { profileService } from '@/features/profile/api/profile.service';
import { WatchHistoryItem } from '@/features/profile/types';
import { MediaGrid } from '@/features/profile/components/MediaGrid';
import { InfiniteScroll } from '@/components/ui/InfiniteScroll';
import { useInfiniteQuery } from '@tanstack/react-query';

export default function HistoryPage({ params }: { params: Promise<{ mediaType: string }> }) {
    const { user } = useAppSelector(state => state.auth);
    const router = useRouter();
    const unwrappedParams = React.use(params) as any;
    const mediaType = unwrappedParams.mediaType === 'shows' ? 'tv' : 'movie';
    const otherType = mediaType === 'tv' ? 'movies' : 'shows';
    
    const {
        data,
        fetchNextPage: loadMore,
        hasNextPage: hasMore,
        isFetchingNextPage: isFetchingMore,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['profile', 'history', mediaType],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await profileService.getWatchHistory(pageParam as number, 20, mediaType);
            return res;
        },
        enabled: !!user,
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return (lastPage?.items?.length || 0) === 20 ? allPages.length + 1 : undefined;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const history = useMemo(() => {
        return data ? data.pages.flatMap(page => page?.items || []) : [];
    }, [data]);

    useEffect(() => {
        if (!user) {
            router.push('/');
        }
    }, [user, router]);

    const items = useMemo(() => {
        return history.map(item => ({ 
            tmdbId: item.tmdbId, 
            mediaType: item.mediaType, 
            watchedAt: item.watchedAt 
        }));
    }, [history]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-24 sm:pb-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl pt-6 sm:pt-12 pb-4 sm:pb-6 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/5 flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/profile')}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors group shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Watch History</h1>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <InfiniteScroll hasMore={!!hasMore} isLoading={isFetchingMore} onLoadMore={loadMore}>
                        <MediaGrid items={items} emptyMessage={`You haven't watched any ${unwrappedParams.mediaType} yet.`} />
                    </InfiniteScroll>
                )}
            </div>
        </div>
    );
}
