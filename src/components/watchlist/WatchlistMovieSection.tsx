import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { WatchlistMovieItem } from './WatchlistMovieItem';
import { InfiniteScroll } from '../InfiniteScroll';

interface WatchlistMovieSectionProps {
    viewMode: 'grid' | 'list';
    refetchTrigger?: number;
}

export function WatchlistMovieSection({ viewMode, refetchTrigger = 0 }: WatchlistMovieSectionProps) {
    const [movies, setMovies] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        const fetchFirstPage = async () => {
            if (movies.length === 0) {
                setIsLoading(true);
            }
            try {
                const res = await api.get(`/users/watchlist/movies/categorized?category=watchlist&page=1&limit=24`);
                setMovies(res.data.data.data);
                setHasMore(res.data.data.hasMore);
                setPage(1);
            } catch (err) {
                console.error('Failed to load watchlist movies', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFirstPage();
    }, [refetchTrigger]);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/users/watchlist/movies/categorized?category=watchlist&page=${nextPage}&limit=24`);
            setMovies(prev => [...prev, ...res.data.data.data]);
            setHasMore(res.data.data.hasMore);
            setPage(nextPage);
        } catch (err) {
            console.error('Failed to load more watchlist movies', err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (movies.length === 0) {
        return (
            <div className="bg-[#0a0a0a] rounded-2xl p-10 flex flex-col items-center text-center border border-zinc-800/50 mt-10">
                <div className="w-16 h-16 bg-zinc-800/80 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Bring your watch history</h2>
                <p className="text-zinc-400 mb-8 max-w-md">
                    You aren&apos;t tracking any movies yet. Add movies to your watchlist to track your progress and see what&apos;s up next.
                </p>
                <button 
                    onClick={() => window.location.href = '/discover'}
                    className="bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-zinc-200 transition-colors"
                >
                    Discover Movies
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className={viewMode === 'grid' ? "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5" : "flex flex-col gap-3"}>
                {movies.map((movie, index) => (
                    <WatchlistMovieItem 
                        key={movie.tmdbId} 
                        tmdbId={movie.tmdbId} 
                        details={movie.details} 
                        viewType={viewMode} 
                        index={index}
                    />
                ))}
            </div>
            
            {hasMore && (
                <InfiniteScroll 
                    hasMore={hasMore} 
                    isLoading={isLoadingMore} 
                    onLoadMore={loadMore} 
                />
            )}
        </div>
    );
}
