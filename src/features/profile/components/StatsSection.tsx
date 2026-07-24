'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ProfileStats } from '../types';

// Convert total minutes to { months, days, hours, minutes }
function minutesToTime(totalMinutes: number) {
    const minutesPerHour = 60;
    const minutesPerDay = 1440;
    const minutesPerMonth = 43800; // 30.4167 days

    const months = Math.floor(totalMinutes / minutesPerMonth);
    const remaining = totalMinutes % minutesPerMonth;
    const days = Math.floor(remaining / minutesPerDay);
    const hours = Math.floor((remaining % minutesPerDay) / minutesPerHour);
    const minutes = (remaining % minutesPerDay) % minutesPerHour;

    return { months, days, hours, minutes };
}

// Animated counter hook
function useCountUp(target: number, duration = 1200, start = false) {
    const [value, setValue] = useState(0);
    const frameRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!start || target === 0) {
            setValue(0);
            return;
        }
        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutQuart
            const eased = 1 - Math.pow(1 - progress, 4);
            setValue(Math.floor(eased * target));
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setValue(target);
            }
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration, start]);

    return value;
}

// Time display sub-component (Months / Days / Hours / Minutes)
function TimeDisplay({ totalMinutes, animate }: { totalMinutes: number; animate: boolean }) {
    const { months, days, hours, minutes } = minutesToTime(totalMinutes);
    const animMonths = useCountUp(months, 1000, animate);
    const animDays = useCountUp(days, 1100, animate);
    const animHours = useCountUp(hours, 1200, animate);
    const animMinutes = useCountUp(minutes, 1300, animate);

    const units = [];
    if (months > 0) units.push({ value: months, label: 'Months', anim: animMonths });
    if (days > 0) units.push({ value: days, label: 'Days', anim: animDays });
    if (hours > 0) units.push({ value: hours, label: 'Hours', anim: animHours });
    if (minutes > 0) units.push({ value: minutes, label: 'Mins', anim: animMinutes });
    
    if (units.length === 0) units.push({ value: 0, label: 'Mins', anim: 0 });

    return (
        <div className="flex items-center justify-center gap-1 sm:gap-3 md:gap-4 lg:gap-5">
            {units.map((u, i) => (
                <div key={i} className="flex flex-col items-center group cursor-default">
                    <span className="text-xl sm:text-3xl lg:text-4xl font-light tracking-wider bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                        {animate ? u.anim : u.value}
                    </span>
                    <span className="text-[6px] sm:text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1 sm:mt-1.5 group-hover:text-zinc-300 transition-colors duration-300">
                        {u.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StatCard({
    icon,
    label,
    children,
    animate,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    animate: boolean;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-4 w-full p-0 sm:p-2 group">
            <div className="flex items-center justify-center gap-1 sm:gap-2 text-zinc-500 group-hover:text-zinc-300 transition-colors duration-500">
                <div className="opacity-70 w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-500">{icon}</div>
                <span className="text-[7px] sm:text-[10px] font-medium tracking-[0.2em] uppercase line-clamp-1 text-center">
                    {label}
                </span>
            </div>
            <div className="flex justify-center items-center w-full">{children}</div>
        </div>
    );
}

// Skeleton loader card
function SkeletonCard() {
    return (
        <div className="flex flex-col items-center gap-2 flex-1 animate-pulse w-full">
            <div className="h-3 w-16 sm:w-24 bg-zinc-800/50 rounded" />
            <div className="flex gap-2 mt-2">
                <div className="h-6 sm:h-10 w-8 sm:w-16 bg-zinc-800/50 rounded" />
                <div className="h-6 sm:h-10 w-8 sm:w-16 bg-zinc-800/50 rounded" />
            </div>
        </div>
    );
}

interface StatsSectionProps {
    stats: ProfileStats | null;
    isLoading: boolean;
}

export const StatsSection = ({ stats, isLoading }: StatsSectionProps) => {
    const [animate, setAnimate] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Trigger animation when section comes into view
    useEffect(() => {
        if (!stats) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setAnimate(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, [stats]);

    const tvIcon = (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );

    const movieIcon = (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
    );

    const episodeIcon = (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const moviesCountIcon = (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
    );

    const animEpisodes = useCountUp(stats?.totalEpisodes || 0, 1200, animate);
    const animMovies = useCountUp(stats?.totalMovies || 0, 1200, animate);

    return (
        <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-white mb-4 tracking-wide">Stats</h2>

            {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-6 sm:gap-y-8 gap-x-4 w-full py-4 sm:py-6 mb-6 sm:mb-8">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : !stats ? null : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-y-10 gap-x-2 w-full py-4 sm:py-6 animate-in fade-in slide-in-from-bottom-2 duration-500 mb-8 sm:mb-12 lg:divide-x lg:divide-white/10">
                    {/* TV Time */}
                    <StatCard icon={tvIcon} label="TV Time" animate={animate}>
                        {stats.totalEpisodeMinutes === 0 ? (
                            <span className="text-zinc-600 text-[10px] sm:text-sm font-medium">No data</span>
                        ) : (
                            <TimeDisplay totalMinutes={stats.totalEpisodeMinutes} animate={animate} />
                        )}
                    </StatCard>

                    {/* Episodes Watched */}
                    <StatCard icon={episodeIcon} label="Episodes" animate={animate}>
                        <div className="flex flex-col items-center group cursor-default">
                            <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wider bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                                {animate
                                    ? animEpisodes.toLocaleString()
                                    : stats.totalEpisodes.toLocaleString()}
                            </span>
                            <span className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1 sm:mt-2 group-hover:text-zinc-300 transition-colors duration-300">
                                Watched
                            </span>
                        </div>
                    </StatCard>

                    {/* Movie Time */}
                    <StatCard icon={movieIcon} label="Movie Time" animate={animate}>
                        {stats.totalMovieMinutes === 0 ? (
                            <span className="text-zinc-600 text-[10px] sm:text-sm font-medium">No data</span>
                        ) : (
                            <TimeDisplay totalMinutes={stats.totalMovieMinutes} animate={animate} />
                        )}
                    </StatCard>

                    {/* Movies Watched */}
                    <StatCard icon={moviesCountIcon} label="Movies" animate={animate}>
                        <div className="flex flex-col items-center group cursor-default">
                            <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wider bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                                {animate
                                    ? animMovies.toLocaleString()
                                    : stats.totalMovies.toLocaleString()}
                            </span>
                            <span className="text-[7px] sm:text-[9px] md:text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1 sm:mt-2 group-hover:text-zinc-300 transition-colors duration-300">
                                Watched
                            </span>
                        </div>
                    </StatCard>
                </div>
            )}
        </div>
    );
};
