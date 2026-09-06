"use client";

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useQueryClient } from '@tanstack/react-query';

export function GlobalCacheInvalidator() {
    const user = useSelector((state: RootState) => state.auth.user);
    const queryClient = useQueryClient();
    
    const currentUserId = user?.id || user?._id || null;
    const prevUserId = useRef(currentUserId);
    const prevWatchlistMovies = useRef(user?.watchlistMovies?.length);
    const prevWatchlistShows = useRef(user?.watchlistShows?.length);

    useEffect(() => {
        if (prevUserId.current !== currentUserId) {
            // User identity changed (login, logout, or account switch): clear all cached user data
            queryClient.clear();
            prevUserId.current = currentUserId;
        }
    }, [currentUserId, queryClient]);

    useEffect(() => {
        if (user && prevWatchlistMovies.current !== undefined) {
            if (user.watchlistMovies?.length !== prevWatchlistMovies.current) {
                queryClient.invalidateQueries({ queryKey: ['watchlist', 'movies'] });
                prevWatchlistMovies.current = user.watchlistMovies?.length;
            }
        } else if (user) {
            prevWatchlistMovies.current = user.watchlistMovies?.length;
        }
    }, [user?.watchlistMovies?.length, queryClient]);

    useEffect(() => {
        if (user && prevWatchlistShows.current !== undefined) {
            if (user.watchlistShows?.length !== prevWatchlistShows.current) {
                queryClient.invalidateQueries({ queryKey: ['watchlist', 'shows'] });
                prevWatchlistShows.current = user.watchlistShows?.length;
            }
        } else if (user) {
            prevWatchlistShows.current = user.watchlistShows?.length;
        }
    }, [user?.watchlistShows?.length, queryClient]);

    return null;
}
