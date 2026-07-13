import { User } from '@/store/slices/authSlice';

export interface UpdateProfileDTO {
    name?: string;
    username?: string;
}

export interface ToggleFavoriteDTO {
    tmdbId: string;
    type: 'shows' | 'movies';
}

export interface WatchHistoryItem {
    id: string; // Mongo ID of the history record
    tmdbId: string;
    mediaType: 'movie' | 'tv';
    watchedAt: string; // ISO date string
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    error: string | null;
}
