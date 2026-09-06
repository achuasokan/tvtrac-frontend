"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert } from 'lucide-react';

interface SpoilerWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SpoilerWarningModal({ isOpen, onClose, onConfirm }: SpoilerWarningModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Card (Matching Screenshot 1) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-sm rounded-[24px] bg-[#141416] border border-zinc-800/90 p-6 shadow-2xl text-center flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-white transition-colors rounded-full"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-extrabold text-white mb-3 tracking-tight">
              Spoiler Warning
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-400 mb-6 leading-relaxed">
              You haven&apos;t watched this episode yet. The discussion may contain spoilers.
            </p>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors shadow-sm"
              >
                View Anyway
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
