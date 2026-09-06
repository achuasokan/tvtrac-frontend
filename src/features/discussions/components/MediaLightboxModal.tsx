'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { CommentMedia } from '../types/discussion.types';

interface MediaLightboxModalProps {
  media: CommentMedia | null;
  onClose: () => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({ media, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && media) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, onClose]);

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions Bar */}
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
            title="Open original"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Content */}
        <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 max-h-[85vh] flex items-center justify-center">
          <img
            src={
              media.type === 'gif' && (media.url.includes('giphy.com') || media.url.includes('i.giphy.com'))
                ? (() => {
                    const match = media.url.match(/(?:giphy\.com\/media\/|i\.giphy\.com\/media\/|i\.giphy\.com\/)([a-zA-Z0-9_-]+)/);
                    return match && match[1] ? `https://i.giphy.com/media/${match[1]}/200.gif` : media.url;
                  })()
                : media.url
            }
            alt="Discussion media"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
};
