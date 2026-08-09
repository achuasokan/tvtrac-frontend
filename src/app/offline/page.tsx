"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// The list of pages a user might have cached from previous visits
const CACHED_PAGES = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "My Shows", href: "/shows", icon: "📺" },
  { label: "My Movies", href: "/movies", icon: "🎬" },
  { label: "Discover", href: "/discover", icon: "🔍" },
  { label: "My Lists", href: "/lists", icon: "📋" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-navigate back when connection is restored
      setTimeout(() => router.back(), 1000);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router]);

  const handleRetry = async () => {
    setChecking(true);
    try {
      // Ping your backend to see if we're back online
      await fetch("/favicon.ico", { cache: "no-store" });
      router.back();
    } catch {
      setChecking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-zinc-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Icon */}
        <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center mb-8 shadow-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 6.343a9 9 0 000 12.728M9.172 9.172a5 5 0 000 7.071M12 12h.01"
            />
          </svg>
        </div>

        {/* Status dot */}
        {isOnline ? (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold">
              Back online! Redirecting…
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1 mb-6">
            <span className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-zinc-400 text-xs font-semibold">
              No internet connection
            </span>
          </div>
        )}

        {/* Heading */}
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
          You&apos;re offline
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-10">
          This page isn&apos;t available offline, but you can still browse
          pages you&apos;ve visited before.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={checking}
          className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-zinc-200 transition-colors mb-8 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {checking ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
              Checking connection…
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </>
          )}
        </button>

        {/* Available cached pages */}
        <div className="w-full">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">
            Available offline
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {CACHED_PAGES.map((page) => (
              <button
                key={page.href}
                onClick={() => router.push(page.href)}
                className="flex items-center gap-2.5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-zinc-700/60 rounded-xl px-3 py-3 text-left transition-all duration-200 group"
              >
                <span className="text-lg">{page.icon}</span>
                <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors truncate">
                  {page.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
            Only pages you&apos;ve visited before will load from cache.
          </p>
        </div>
      </div>
    </main>
  );
}
