import React, { useMemo, useState } from 'react';
import { WatchlistShowItem } from './WatchlistShowItem';
import { InfiniteScroll } from '../InfiniteScroll';
import { useWatchlistCategory } from '@/features/watchlist/api/useWatchlist';

interface UpcomingSectionProps {
    viewMode: 'grid' | 'list';
}

export function UpcomingSection({ viewMode }: UpcomingSectionProps) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useWatchlistCategory('upcoming', 20);

    const [recentlyAiredExpanded, setRecentlyAiredExpanded] = useState(false);

    const shows = useMemo(() => {
        return data?.pages.flatMap(page => page.data) || [];
    }, [data]);

    // Separate upcoming (today or future) from recently aired (past)
    const { upcomingShows, recentlyAiredShows } = useMemo(() => {
        const upcoming: any[] = [];
        const recentlyAired: any[] = [];
        for (const show of shows) {
            if (show.isRecentlyAired) {
                recentlyAired.push(show);
            } else {
                upcoming.push(show);
            }
        }
        return { upcomingShows: upcoming, recentlyAiredShows: recentlyAired };
    }, [shows]);

    const groupedShows = useMemo(() => {
        const grouped: { [dateLabel: string]: any[] } = {};
        for (const show of upcomingShows) {
            let dateLabel = '';
            const daysLeft = show.daysLeft;

            if (daysLeft === 0) {
                dateLabel = 'Today';
            } else if (daysLeft === 1) {
                dateLabel = 'Tomorrow';
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
    }, [upcomingShows]);

    const groupedRecentlyAired = useMemo(() => {
        const grouped: { [dateLabel: string]: any[] } = {};
        for (const show of recentlyAiredShows) {
            let dateLabel = '';
            const daysLeft = show.daysLeft;

            if (daysLeft === -1) {
                dateLabel = 'Yesterday';
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
    }, [recentlyAiredShows]);

    // Sort recently aired keys newest first (yesterday → oldest)
    const recentlyAiredKeys = useMemo(() => {
        return Object.keys(groupedRecentlyAired).sort((a, b) => {
            // Use the airDate of the first show in each group to compare
            const aDate = new Date(groupedRecentlyAired[a][0].airDate).getTime();
            const bDate = new Date(groupedRecentlyAired[b][0].airDate).getTime();
            return bDate - aDate; // newest first
        });
    }, [groupedRecentlyAired]);

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
            {/* Upcoming (today and future) */}
            {groupKeys.length > 0 && groupKeys.map(dateLabel => (
                <div key={dateLabel}>
                    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-2">
                        <div className={`w-2 h-2 rounded-full ${dateLabel === 'Today' ? 'bg-[#4B832B] shadow-[0_0_10px_rgba(75,131,43,0.8)]' : 'bg-white'}`} />
                        <h2 className={`text-sm sm:text-base font-bold tracking-widest ${dateLabel === 'Today' ? 'text-white' : 'text-zinc-300'}`}>
                            {dateLabel.toUpperCase()}
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent ml-2" />
                    </div>
                    <div className={viewMode === 'grid' ? 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5' : 'flex flex-col gap-3'}>
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

            {/* No upcoming episodes message when there are only recently aired */}
            {groupKeys.length === 0 && upcomingShows.length === 0 && recentlyAiredShows.length > 0 && (
                <div className="flex justify-center py-6 text-zinc-500 text-sm">
                    No upcoming episodes scheduled right now.
                </div>
            )}

            {/* Recently Aired collapsible section */}
            {recentlyAiredKeys.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setRecentlyAiredExpanded(prev => !prev)}
                        className="flex items-center gap-3 mb-2 group w-full text-left"
                    >
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                        <h2 className="text-sm sm:text-base font-bold tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            RECENTLY AIRED
                        </h2>
                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-800/60 to-transparent ml-2" />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 text-zinc-600 transition-transform duration-200 ${recentlyAiredExpanded ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {recentlyAiredExpanded && (
                        <div className="flex flex-col gap-8 mt-6">
                            {recentlyAiredKeys.map(dateLabel => (
                                <div key={dateLabel}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                        <h3 className="text-xs sm:text-sm font-bold tracking-widest text-zinc-600">
                                            {dateLabel === 'Yesterday' ? 'YESTERDAY' : dateLabel.toUpperCase()}
                                        </h3>
                                        <div className="flex-1 h-px bg-gradient-to-r from-zinc-800/40 to-transparent ml-2" />
                                    </div>
                                    <div className={`opacity-60 ${viewMode === 'grid' ? 'grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5' : 'flex flex-col gap-3'}`}>
                                        {groupedRecentlyAired[dateLabel].map((show, index) => (
                                            <WatchlistShowItem
                                                key={`recent-${show.tmdbId}-${index}`}
                                                {...show}
                                                viewType={viewMode}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
