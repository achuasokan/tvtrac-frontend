'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { MediaGrid } from '@/features/profile/components/MediaGrid';

export default function FavoritesPage({ params }: { params: { mediaType: string } }) {
    const { user } = useAppSelector(state => state.auth);
    const router = useRouter();
    const unwrappedParams = React.use(params) as any;
    const mediaType = unwrappedParams.mediaType === 'shows' ? 'tv' : 'movie';
    
    if (!user) {
        router.push('/');
        return null;
    }

    const items = useMemo(() => {
        const sourceList = mediaType === 'tv' ? user.favoriteShows : user.favoriteMovies;
        return (sourceList || []).map(id => ({ 
            tmdbId: id, 
            mediaType: mediaType as 'tv' | 'movie'
        }));
    }, [user, mediaType]);

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
                        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span className="text-red-500">❤️</span> Favorites
                        </h1>
                        <p className="text-zinc-500 mt-1">Your favorite {mediaType === 'tv' ? 'shows' : 'movies'}</p>
                    </div>
                </div>

                <MediaGrid items={items} emptyMessage={`You don't have any favorite ${unwrappedParams.mediaType} yet.`} />
            </div>
        </div>
    );
}
