import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { WatchlistShowItem } from './WatchlistShowItem';
import { InfiniteScroll } from '../InfiniteScroll';

interface UpcomingSectionProps {
    viewMode: 'grid' | 'list';
}

export function UpcomingSection({ viewMode }: UpcomingSectionProps) {
    const [shows, setShows] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        const fetchFirstPage = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/users/watchlist/shows/categorized?category=upcoming&page=1&limit=20`);
                setShows(res.data.data.data);
                setHasMore(res.data.data.hasMore);
                setPage(1);
            } catch (err) {
                console.error('Failed to load upcoming shows', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFirstPage();
    }, []);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            const nextPage = page + 1;
            const res = await api.get(`/users/watchlist/shows/categorized?category=upcoming&page=${nextPage}&limit=20`);
            setShows(prev => [...prev, ...res.data.data.data]);
            setHasMore(res.data.data.hasMore);
            setPage(nextPage);
        } catch (err) {
            console.error('Failed to load more upcoming shows', err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const groupedShows = useMemo(() => {
        const grouped: { [dateLabel: string]: any[] } = {};
        for (const show of shows) {
            let dateLabel = "";
            const daysLeft = show.daysLeft;
            
            if (daysLeft === 0) {
                dateLabel = "Today";
            } else if (daysLeft === 1) {
                dateLabel = "Tomorrow";
            } else if (daysLeft === -1) {
                dateLabel = "Yesterday";
            } else {
                const date = new Date(show.airDate);
                dateLabel = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            }

            if (!grouped[dateLabel]) {
                grouped[dateLabel] = [];
            }
            grouped[dateLabel].push(show);
        }
        return grouped;
    }, [shows]);

    const groupKeys = Object.keys(groupedShows);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (shows.length === 0) {
        return (
            <div className="flex justify-center py-20 text-zinc-500">
                No upcoming episodes.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10">
            {groupKeys.map(dateLabel => (
                <div key={dateLabel}>
                    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-2">
                        <div className={`w-2 h-2 rounded-full ${dateLabel === 'Today' ? 'bg-[#4B832B] shadow-[0_0_10px_rgba(75,131,43,0.8)]' : dateLabel === 'Tomorrow' || dateLabel === 'Yesterday' ? 'bg-white' : 'bg-zinc-700'}`} />
                        <h2 className={`text-sm sm:text-base font-bold tracking-widest ${dateLabel === 'Today' ? 'text-white' : 'text-zinc-300'}`}>
                            {dateLabel.toUpperCase()}
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-2" />
                    </div>
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5" : "flex flex-col gap-3"}>
                        {groupedShows[dateLabel].map((show, index) => (
                            <WatchlistShowItem 
                                key={`${show.tmdbId}-${index}`} 
                                {...show} 
                                viewType={viewMode}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            ))}

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
