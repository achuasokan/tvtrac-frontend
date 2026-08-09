"use client";

import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function InstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Don't show if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    if (isInstallable && !dismissed) {
      // Small delay so it doesn't pop up immediately on load
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isInstallable, dismissed]);

  const handleInstall = async () => {
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500"
      role="dialog"
      aria-label="Install tvtrac app"
    >
      <div className="flex items-center gap-3 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50">
        {/* App Icon */}
        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src="/favicon-96x96.png"
            alt="tvtrac"
            className="w-8 h-8 object-contain"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">
            Install tvtrac
          </p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-tight truncate">
            Add to home screen for quick access
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Dismiss install prompt"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isInstalling ? "Installing…" : "Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
