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
        return (sourceList || []).map(id => ({ 
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
                <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl pt-6 sm:pt-12 pb-4 sm:pb-6 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/5 flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/profile')}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors group shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-400 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Favorites</h1>
                </div>

                <InfiniteScroll hasMore={hasMore} isLoading={false} onLoadMore={() => setPage(prev => prev + 1)}>
                    <MediaGrid items={items} emptyMessage={`You don't have any favorite ${unwrappedParams.mediaType} yet.`} />
                </InfiniteScroll>
            </div>
        </div>
    );
}
