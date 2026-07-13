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
    },
    TRACKING: {
        HISTORY: '/tracking/history',
    },
} as const;
