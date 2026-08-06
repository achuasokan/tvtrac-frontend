import React from 'react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-in slide-in-from-bottom-5 fade-in duration-300 w-[90%] max-w-[320px] sm:w-auto sm:max-w-none">
      <div className="relative w-full rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-[0_8px_30px_rgba(254,215,184,0.15)] flex items-center gap-3 px-4 sm:px-5 py-3">
        {/* Sci-Fi Fading Border Glow */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none rounded-2xl border-[1.5px] border-transparent"
          style={{
            background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.3) 40%, transparent 75%) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude'
          }}
        />
        
        <div className="bg-[#fed7b8]/20 text-[#fed7b8] p-1.5 rounded-full z-20 shadow-[0_0_8px_rgba(254,215,184,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-[13px] sm:text-sm font-bold tracking-wide text-white whitespace-nowrap z-20">
          {message}
        </span>
      </div>
    </div>
  );
}
