import React, { useMemo } from 'react';
import { WatchlistShowItem } from './WatchlistShowItem';
import { InfiniteScroll } from '../InfiniteScroll';
import { useWatchlistCategory } from '@/features/watchlist/api/useWatchlist';

interface WatchlistSectionProps {
    category: string;
    viewMode: 'grid' | 'list';
    onToggleWatched: (e: React.MouseEvent, tmdbId: string, season: number, episode: number) => void;
}

export function WatchlistSection({ category, viewMode, onToggleWatched }: WatchlistSectionProps) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useWatchlistCategory(category);

    const shows = useMemo(() => {
        return data?.pages.flatMap(page => page.data) || [];
    }, [data]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (shows.length === 0) {
        return (
            <div className="flex justify-center py-20 text-zinc-500 text-sm">
                {category === 'watch-next' && "No shows in 'Watch Next'. You're all caught up or haven't started any yet!"}
                {category === 'havent-watched-for-a-while' && "No shows in 'Haven't Watched'. All started shows have been watched recently!"}
                {category === 'havent-started' && "No unwatched shows waiting to be started."}
                {category === 'history' && "No watch history recorded yet."}
            </div>
        );
    }

    return (
        <div>
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
                        />
                    );
                })}
            </div>
            
            {hasNextPage && (
                <InfiniteScroll 
                    hasMore={!!hasNextPage} 
                    isLoading={isFetchingNextPage} 
                    onLoadMore={() => fetchNextPage()} 
                />
            )}
        </div>
    );
}

