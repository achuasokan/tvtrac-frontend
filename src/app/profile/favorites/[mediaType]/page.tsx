'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { MediaGrid } from '@/features/profile/components/MediaGrid';
import { InfiniteScroll } from '@/components/ui/InfiniteScroll';

export default function FavoritesPage({ params }: { params: Promise<{ mediaType: string }> }) {
    const { user } = useAppSelector(state => state.auth);
    const router = useRouter();
    const unwrappedParams = React.use(params) as any;
    const mediaType = unwrappedParams.mediaType === 'shows' ? 'tv' : 'movie';
    
    const [page, setPage] = useState(1);
    const observer = useRef<IntersectionObserver | null>(null);

    const allItems = useMemo(() => {
        const sourceList = mediaType === 'tv' ? user?.favoriteShows : user?.favoriteMovies;
        return [...(sourceList || [])].reverse().map(id => ({ 
            tmdbId: id, 
            mediaType: mediaType as 'tv' | 'movie'
        }));
    }, [user, mediaType]);

    const items = useMemo(() => {
        return allItems.slice(0, page * 20);
    }, [allItems, page]);

    const hasMore = items.length < allItems.length;

    useEffect(() => {
        if (!user) {
            router.push('/');
        }
    }, [user, router]);

    if (!user) return null;

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
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Favorites</h1>
                </div>

                <InfiniteScroll hasMore={hasMore} isLoading={false} onLoadMore={() => setPage(prev => prev + 1)}>
                    <MediaGrid items={items} emptyMessage={`You don't have any favorite ${unwrappedParams.mediaType} yet.`} />
                </InfiniteScroll>
            </div>
        </div>
    );
}
