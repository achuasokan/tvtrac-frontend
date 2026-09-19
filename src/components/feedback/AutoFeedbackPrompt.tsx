"use client";

import { useState, useEffect } from "react";
import { MessageSquareHeart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedbackModal } from "@/features/profile/components/FeedbackModal";

// ── Explicit UI Prompt State Keys in localStorage ──
export const STORAGE_KEYS = {
  SESSION_COUNT: "tvtrac_feedback_session_count",
  DISMISSED_UNTIL: "tvtrac_feedback_prompt_dismissed_until",
  SUBMITTED: "tvtrac_feedback_submitted",
} as const;

const SESSION_FLAG = "tvtrac_session_counted";
const COOLDOWN_DAYS = 30;
const MIN_SESSIONS = 2; // Prompt only on 2nd session onwards
const TARGET_ACTIVE_TIME_MS = 25000; // 25s of active, visible browsing

export function AutoFeedbackPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. If user already submitted feedback, disable automatic prompt (manual button remains available)
    if (localStorage.getItem(STORAGE_KEYS.SUBMITTED) === "true") {
      return;
    }

    // 2. Read & track session count (increment only once per browser session window)
    const rawSessions = localStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
    let sessions = rawSessions ? parseInt(rawSessions, 10) : 0;
    if (isNaN(sessions)) sessions = 0;

    if (!sessionStorage.getItem(SESSION_FLAG)) {
      sessionStorage.setItem(SESSION_FLAG, "true");
      sessions += 1;
      localStorage.setItem(STORAGE_KEYS.SESSION_COUNT, sessions.toString());
    }

    // 3. Minimum 2nd session requirement
    if (sessions < MIN_SESSIONS) {
      return;
    }

    // 4. Check 30-day dismissal cooldown timestamp
    const rawDismissedUntil = localStorage.getItem(STORAGE_KEYS.DISMISSED_UNTIL);
    if (rawDismissedUntil) {
      const dismissedUntil = parseInt(rawDismissedUntil, 10);
      if (!isNaN(dismissedUntil) && Date.now() < dismissedUntil) {
        return;
      }
    }

    // 5. Exclude auth/login routes
    const pathname = window.location.pathname;
    if (pathname.includes("/login") || pathname.includes("/register")) {
      return;
    }

    // 6. Active Browsing Timer with Page Visibility API
    // Pauses when tab is hidden / PWA is backgrounded, resumes when visible.
    let accumulatedMs = 0;
    let lastTick = Date.now();
    let timer: ReturnType<typeof setInterval> | null = null;
    let isTriggered = false;

    const tick = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        accumulatedMs += now - lastTick;
        lastTick = now;

        if (accumulatedMs >= TARGET_ACTIVE_TIME_MS && !isTriggered) {
          isTriggered = true;
          if (timer) clearInterval(timer);

          // Avoid clashing if PWA install prompt is currently active
          const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
          const pwaDismissed = sessionStorage.getItem("pwa-install-dismissed") === "true";
          if (!isStandalone && !pwaDismissed) {
            setTimeout(() => setShowPrompt(true), 12000);
          } else {
            setShowPrompt(true);
          }
        }
      } else {
        lastTick = Date.now();
      }
    };

    const startTimer = () => {
      if (timer || isTriggered) return;
      lastTick = Date.now();
      timer = setInterval(tick, 500);
    };

    const stopTimer = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastTick = Date.now();
        startTimer();
      } else {
        stopTimer();
      }
    };

    if (document.visibilityState === "visible") {
      startTimer();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    // 30-day cooldown timestamp
    const dismissedUntil = Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_UNTIL, dismissedUntil.toString());
    } catch {
      // ignore
    }
  };

  const handleOpenFeedback = () => {
    setShowPrompt(false);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* ── Option 3: Docked Bottom Sheet Tab (iOS Ambient Dock) ── */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ y: 35, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+62px)] sm:bottom-[68px] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-sm pointer-events-auto"
            role="dialog"
            aria-label="Feedback prompt"
          >
            {/* Docked Sheet Card — Comfortable Mobile Width, Slim Height */}
            <div className="relative overflow-hidden bg-black/85 sm:bg-zinc-950/90 backdrop-blur-2xl border border-white/[0.12] rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 shadow-[0_-8px_25px_rgba(0,0,0,0.5),0_12px_35px_rgba(0,0,0,0.85)] w-full flex items-center justify-between gap-2.5">
              {/* Specular Top Edge Glow Line */}
              <div
                className="absolute top-0 inset-x-0 h-[1px] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.7) 35%, rgba(45, 212, 191, 0.7) 65%, transparent 100%)",
                }}
              />

              {/* Ambient Bottom Teal Accent */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-teal-500/15 blur-lg pointer-events-none rounded-full"
              />

              <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1">
                {/* Slim Neon Icon Disc */}
                <div className="w-8 h-8 rounded-lg bg-teal-400/[0.12] border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(45,212,191,0.15)]">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>

                {/* Text Content (Single Line, Never Wraps) */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white tracking-tight leading-tight whitespace-nowrap">
                      Enjoying TVTrac?
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight truncate whitespace-nowrap">
                    Help us shape the next updates
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                {/* Dismiss (✕) */}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  aria-label="Dismiss feedback prompt"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Share CTA Button */}
                <button
                  type="button"
                  onClick={handleOpenFeedback}
                  className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-100 shadow-[0_2px_8px_rgba(255,255,255,0.12)] transition-all active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <span>Share</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Triggered Feedback Modal ── */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(null), 3500);
        }}
      />

      {/* ── Success Toast ── */}
      {toastMsg && (
        <div className="fixed top-14 sm:top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none max-w-[85vw]">
          <div className="bg-zinc-950/95 backdrop-blur-xl text-zinc-100 px-3.5 py-1.5 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.85)] flex items-center gap-2 border border-white/10">
            <span className="text-xs font-semibold tracking-wide text-teal-300">{toastMsg}</span>
          </div>
        </div>
      )}
    </>
  );
}
