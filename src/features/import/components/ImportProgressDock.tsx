'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useActiveImportJob } from '../hooks/useActiveImportJob';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

function TvTimeLogo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#FFD200" />
      <path d="M5 8H19M12 8V18" stroke="#141414" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Fixed viewBox units — SVG scales with CSS width/height
const VB = 100; // viewBox size
const STROKE = 4;
const RADIUS = VB / 2 - STROKE / 2 - 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ImportProgressDock() {
  const pathname = usePathname();
  const { jobId, state, progress, isRunning, clearActiveJob } = useActiveImportJob();

  const total = progress.total || 0;
  const processed = progress.processed || 0;
  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const isCompleted = state === 'completed';
  const isFailed = state === 'failed';

  const displayPercent = isCompleted ? 100 : percent;
  const dashOffset = CIRCUMFERENCE - (displayPercent / 100) * CIRCUMFERENCE;

  // Desktop notification on complete
  const hasNotifiedRef = React.useRef(false);
  React.useEffect(() => {
    if (isCompleted && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          const n = new Notification('TVTrac: Import Finished!', {
            body: `${progress.imported.toLocaleString()} items imported.${
              progress.unresolved > 0 ? ` ${progress.unresolved} need matching.` : ''
            }`,
            icon: '/favicon.ico',
          });
          n.onclick = () => { window.focus(); };
        } catch (e) {
          console.error('Notification failed:', e);
        }
      }
    } else if (isRunning) {
      hasNotifiedRef.current = false;
    }
  }, [isCompleted, isRunning, progress.imported, progress.unresolved]);

  if (pathname === '/profile/import') return null;
  if (!jobId || state === 'idle' || state === 'unknown') return null;

  const glowColor = isCompleted
    ? 'rgba(52,211,153,0.28)'
    : isFailed
    ? 'rgba(245,158,11,0.22)'
    : 'rgba(45,212,191,0.28)';

  return (
    <aside
      aria-label="Background Import Status"
      className="
        fixed bottom-20 sm:bottom-5 right-3 sm:right-5
        z-[9999]
        w-24 h-24 sm:w-28 sm:h-28 md:w-[124px] md:h-[124px]
        animate-in slide-in-from-bottom-4 duration-300
      "
    >
      {/* Dismiss button — outside the circle, top-right corner */}
      <button
        type="button"
        onClick={clearActiveJob}
        aria-label="Dismiss"
        className="
          absolute -top-2 -right-2 z-10
          w-5 h-5 rounded-full
          bg-zinc-800 border border-zinc-700
          flex items-center justify-center
          text-zinc-300 hover:text-white hover:bg-zinc-700
          transition-colors cursor-pointer shadow-md
        "
      >
        <X className="w-2.5 h-2.5" />
      </button>
      {/* Ambient glow (separate so backdrop-blur doesn't eat it) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: `0 0 28px 5px ${glowColor}` }}
      />

      {/* Glassmorphism circle shell */}
      <div
        className="relative w-full h-full rounded-full"
        style={{
          background: 'rgba(12, 12, 18, 0.80)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* SVG ring — viewBox 100×100, scales with CSS size */}
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="pg-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#FFD200" />
            </linearGradient>
            <linearGradient id="pg-ok" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="pg-err" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={VB / 2} cy={VB / 2} r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {/* Arc */}
          <circle
            cx={VB / 2} cy={VB / 2} r={RADIUS}
            fill="none"
            stroke={isFailed ? 'url(#pg-err)' : isCompleted ? 'url(#pg-ok)' : 'url(#pg-g)'}
            strokeWidth={STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Inner content — flex column, top/center/bottom */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-3 px-2">

          {/* Top: logo */}
          <div className="flex items-center justify-center w-full">
            <TvTimeLogo size={12} />
          </div>

          {/* Center: percentage or icon */}
          <Link href="/profile/import" className="flex flex-col items-center group -mt-1">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
            ) : isFailed ? (
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            ) : (
              <>
                <span className="text-lg sm:text-xl font-black text-white leading-none group-hover:text-[#2dd4bf] transition-colors">
                  {displayPercent}%
                </span>
                {total > 0 && (
                  <span className="text-[8px] sm:text-[9px] text-zinc-500 leading-none mt-0.5">
                    {processed}/{total}
                  </span>
                )}
              </>
            )}
          </Link>

          {/* Bottom: step + link */}
          <Link
            href="/profile/import"
            className="flex flex-col items-center gap-0.5 w-full"
          >
            <p className="text-[8px] sm:text-[9px] text-zinc-400 text-center leading-tight line-clamp-1 w-full px-1">
              {isRunning
                ? (progress.currentStep || 'Processing...')
                : isCompleted
                ? `${progress.imported.toLocaleString()} imported`
                : 'Halted'}
            </p>
            <span className="text-[8px] sm:text-[9px] font-bold text-[#2dd4bf] hover:text-[#5eead4] transition-colors">
              {isCompleted && progress.unresolved > 0 ? 'Match →' : 'View →'}
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
