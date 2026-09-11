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
                <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl pt-6 sm:pt-12 pb-4 sm:pb-6 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/5 flex items-center gap-3.5 sm:gap-4">
                    <button 
                        type="button"
                        onClick={() => router.push('/profile')}
                        aria-label="Back to Profile"
                        className="group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm bg-zinc-900/90 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800/90 hover:border-[#2dd4bf]/50 hover:shadow-[0_0_15px_rgba(45,212,191,0.18)] active:scale-95 transition-all duration-200 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0 backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Watch History</h1>
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
