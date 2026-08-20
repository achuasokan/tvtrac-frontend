'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileThemeContextType {
    dominantColor: string | null;
    setDominantColor: (color: string | null) => void;
}

const ProfileThemeContext = createContext<ProfileThemeContextType>({
    dominantColor: null,
    setDominantColor: () => {},
});

export const ProfileThemeProvider = ({ children }: { children: ReactNode }) => {
    const [dominantColor, setDominantColor] = useState<string | null>(null);

    return (
        <ProfileThemeContext.Provider value={{ dominantColor, setDominantColor }}>
            {children}
        </ProfileThemeContext.Provider>
    );
};

export const useProfileTheme = () => useContext(ProfileThemeContext);
