export const API_ROUTES = {
    AUTH: {
        LOGIN_GOOGLE: '/auth/google',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
    },
    USERS: {
        PROFILE: '/users/profile',
        AVATAR: '/users/profile/avatar',
        COVER_PHOTO: '/users/profile/cover-photo',
        FAVORITES: '/users/favorites',
        WATCHLIST: '/users/watchlist',
    },
    TRACKING: {
        HISTORY: '/tracking/history',
        STATS: '/tracking/stats',
        IMPORT_BATCH: '/tracking/import/batch',
        IMPORT_MOVIES_BATCH: '/tracking/import/movies/batch',
    },
    LISTS: {
        IMPORT_BATCH: '/lists/import/batch',
    },
} as const;
