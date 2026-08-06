import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { WatchlistShowItem } from './WatchlistShowItem';
import { InfiniteScroll } from '../InfiniteScroll';

interface WatchlistSectionProps {
    title: string;
    category: string;
    viewMode: 'grid' | 'list';
    onToggleWatched: (e: React.MouseEvent, tmdbId: string, season: number, episode: number) => void;
    togglingIds: Set<string>;
    refetchTrigger?: number;
}

export function WatchlistSection({ title, category, viewMode, onToggleWatched, togglingIds, refetchTrigger = 0 }: WatchlistSectionProps) {
    const [shows, setShows] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        const fetchFirstPage = async () => {
            if (shows.length === 0) {
                setIsLoading(true);
            }
            try {
                const res = await api.get(`/users/watchlist/shows/categorized?category=${category}&page=1&limit=10`);
                setShows(res.data.data.data);
                setHasMore(res.data.data.hasMore);
                setPage(1);
            } catch (err) {
                console.error(`Failed to load category ${category}`, err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFirstPage();
    }, [category, refetchTrigger]);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/users/watchlist/shows/categorized?category=${category}&page=${nextPage}&limit=10`);
            setShows(prev => [...prev, ...res.data.data.data]);
            setHasMore(res.data.data.hasMore);
            setPage(nextPage);
        } catch (err) {
            console.error(`Failed to load more for category ${category}`, err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (isLoading) {
        return (
            <div>
                <div className="flex justify-center mb-4">
                    <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-800/50 px-4 py-1 rounded-full">
                        {title}
                    </span>
                </div>
                <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (shows.length === 0) {
        return null; // Don't show the section if it's empty
    }

    return (
        <div>
            {category === 'history' ? (
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Continue Watching
                </h2>
            ) : (
                <div className="flex justify-center mb-4">
                    <span className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase bg-zinc-800/50 px-4 py-1 rounded-full">
                        {title}
                    </span>
                </div>
            )}
            
            <div className={viewMode === 'grid' ? "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5" : (category === 'history' ? "flex flex-col gap-2" : "flex flex-col gap-3")}>
                {shows.map((show, index) => {
                    const key = category === 'history' ? `history-${show.tmdbId}-${index}` : show.tmdbId;
                    return (
                        <WatchlistShowItem 
                            key={key} 
                            {...show} 
                            viewType={viewMode}
                            index={index}
                            onToggleWatched={(e, season, episode) => onToggleWatched(e, show.tmdbId, season, episode)}
                            isToggling={togglingIds.has(`${show.tmdbId}-${show.nextSeason}-${show.nextEpisode}`)}
                        />
                    );
                })}
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
