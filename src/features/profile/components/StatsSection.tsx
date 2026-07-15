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

    // Less than 1 hour — show minutes only
    if (totalMinutes < 60) {
        return (
            <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {animate ? animMinutes : minutes}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-500">m</span>
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            {months > 0 && (
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {animate ? animMonths : months}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-500">mo</span>
                </div>
            )}
            {(days > 0 || months > 0) && (
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {animate ? animDays : days}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-500">d</span>
                </div>
            )}
            <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {animate ? animHours : hours}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-zinc-500">h</span>
            </div>
            {minutes > 0 && (
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {animate ? animMinutes : minutes}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-500">m</span>
                </div>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    children,
    animate,
    accentColor = "from-zinc-500 to-zinc-700"
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    animate: boolean;
    accentColor?: string;
}) {
    return (
        <div className={`flex flex-col gap-1 sm:gap-2 relative pl-4 sm:pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-gradient-to-b ${accentColor}`}>
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500">
                <div className="opacity-70">{icon}</div>
                <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">
                    {label}
                </span>
            </div>
            <div className="w-full mt-0.5 sm:mt-1">{children}</div>
        </div>
    );
}

// Skeleton loader card
function SkeletonCard() {
    return (
        <div className="flex flex-col gap-1 sm:gap-2 relative pl-4 sm:pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-zinc-800 animate-pulse">
            <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500">
                <div className="w-4 h-4 rounded bg-zinc-800" />
                <div className="h-3 w-20 bg-zinc-800 rounded" />
            </div>
            <div className="w-full mt-0.5 sm:mt-1 flex gap-2">
                <div className="h-8 w-12 bg-zinc-800 rounded" />
                <div className="h-8 w-12 bg-zinc-800 rounded" />
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 md:gap-8 lg:gap-12 pb-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : !stats ? null : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4 md:gap-8 lg:gap-12 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* TV Time */}
                    <StatCard icon={tvIcon} label="TV Time" animate={animate} accentColor="from-blue-500 to-cyan-400">
                        {stats.totalEpisodeMinutes === 0 ? (
                            <span className="text-zinc-600 text-sm font-medium">No data yet</span>
                        ) : (
                            <TimeDisplay totalMinutes={stats.totalEpisodeMinutes} animate={animate} />
                        )}
                    </StatCard>

                    {/* Episodes Watched */}
                    <StatCard icon={episodeIcon} label="Episodes Watched" animate={animate} accentColor="from-emerald-500 to-teal-400">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {animate
                                ? animEpisodes.toLocaleString()
                                : stats.totalEpisodes.toLocaleString()}
                        </span>
                    </StatCard>

                    {/* Movie Time */}
                    <StatCard icon={movieIcon} label="Movie Time" animate={animate} accentColor="from-purple-500 to-pink-400">
                        {stats.totalMovieMinutes === 0 ? (
                            <span className="text-zinc-600 text-sm font-medium">No data yet</span>
                        ) : (
                            <TimeDisplay totalMinutes={stats.totalMovieMinutes} animate={animate} />
                        )}
                    </StatCard>

                    {/* Movies Watched */}
                    <StatCard icon={moviesCountIcon} label="Movies Watched" animate={animate} accentColor="from-orange-500 to-yellow-400">
                        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            {animate
                                ? animMovies.toLocaleString()
                                : stats.totalMovies.toLocaleString()}
                        </span>
                    </StatCard>
                </div>
            )}
        </div>
    );
};
