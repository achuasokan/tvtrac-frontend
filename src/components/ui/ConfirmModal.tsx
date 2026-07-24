"use client";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" />

      {/* Modal Dialog */}
      <div 
        className={`relative isolate z-10 w-full max-w-sm mx-auto rounded-3xl overflow-hidden flex flex-col items-center p-6 sm:p-8 text-center bg-zinc-950/80 backdrop-blur-2xl border border-transparent transition-all animate-in zoom-in-95 fade-in duration-200 ${
          isDestructive 
            ? 'shadow-[0_10px_40px_rgba(239,68,68,0.15)]' 
            : 'shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sci-Fi Fading Border Glow */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none rounded-3xl border-[1.5px] border-transparent"
          style={{
            background: isDestructive 
              ? 'linear-gradient(to top, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0.4) 25%, transparent 50%) border-box' 
              : 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.4) 25%, transparent 50%) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
            transform: 'translateZ(0)'
          }}
        />

        {/* Glow effect behind icon */}
        {isDestructive && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-36 bg-red-500/20 blur-[50px] rounded-full pointer-events-none" />
        )}

        {/* Icon Badge */}
        <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-lg ${
          isDestructive 
            ? 'bg-red-500/10 border border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
            : 'bg-zinc-800/80 border border-white/10 text-white'
        }`}>
          {isDestructive ? (
            <svg className="w-8 h-8 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <h2 className="relative z-10 text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">
          {title}
        </h2>
        <p className="relative z-10 text-sm text-zinc-400 mb-8 leading-relaxed max-w-[280px]">
          {message}
        </p>

        {/* Vertical Action Buttons */}
        <div className="relative z-10 flex flex-col w-full gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isDestructive
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white text-black hover:bg-zinc-200 shadow-lg hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3.5 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/10 text-zinc-300 hover:text-white text-[15px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
