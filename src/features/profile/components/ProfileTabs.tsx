'use client';

import React from 'react';

interface ProfileTabsProps {
    activeTab: 'favorites' | 'history';
    setActiveTab: (tab: 'favorites' | 'history') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="flex justify-center mb-8">
            <div className="flex p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 backdrop-blur-sm w-full max-w-md">
                <button
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                        activeTab === 'favorites'
                            ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Favorites
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
                        activeTab === 'history'
                            ? 'bg-slate-800 text-slate-100 shadow-md border border-slate-700/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Watch History
                </button>
            </div>
        </div>
    );
};
