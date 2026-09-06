'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Loader2 } from 'lucide-react';

interface GifItem {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height_small?: {
      url: string;
    };
  };
}

interface GifPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gif: { providerId: string; previewUrl: string }) => void;
}

const CATEGORIES = [
  { label: '🔥 Trending', query: '' },
  { label: '🍿 Cinema', query: 'movie reaction' },
  { label: '😂 Funny', query: 'funny reaction' },
  { label: '🤯 Mindblown', query: 'mind blown' },
  { label: '👏 Applause', query: 'clapping applause' },
  { label: '😭 Emotional', query: 'crying tears' },
  { label: '💀 Dead', query: 'i am dead laughing' },
  { label: '🎉 Celebration', query: 'cheering celebration' },
  { label: '❤️ Love', query: 'love heart' },
  { label: '🤔 Confused', query: 'confused wait what' },
];

const GIPHY_PUBLIC_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';

export const GifPickerModal: React.FC<GifPickerModalProps> = ({ isOpen, onClose, onSelectGif }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('🔥 Trending');
  const [gifs, setGifs] = useState<GifItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open on all devices
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchGifs = async (query: string) => {
      if (!GIPHY_PUBLIC_KEY) {
        setError('GIPHY API key not configured. Add NEXT_PUBLIC_GIPHY_API_KEY to .env.local');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const endpoint = query.trim()
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_PUBLIC_KEY}&q=${encodeURIComponent(
              query.trim()
            )}&limit=24&rating=g`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_PUBLIC_KEY}&limit=24&rating=g`;

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to load GIFs');
        const json = await res.json();
        setGifs(json.data || []);
      } catch (err: any) {
        console.error('GIPHY fetch error:', err);
        setError('Unable to load GIFs. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchGifs(searchQuery);
    }, searchQuery ? 400 : 0);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-xl md:max-w-2xl h-[86dvh] sm:h-[600px] max-h-[86dvh] sm:max-h-[85vh] flex flex-col bg-zinc-950/98 sm:bg-zinc-950/95 border-t sm:border border-zinc-800/90 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 rounded-full bg-zinc-700/60 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Integrated Header: Search Bar & Categories */}
        <div className="p-3 sm:p-4 pb-2 sm:pb-3 space-y-2.5 border-b border-zinc-800/60 bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeCategory && e.target.value !== '') {
                    setActiveCategory('');
                  }
                }}
                placeholder="Search GIFs..."
                autoFocus
                className="w-full pl-9 sm:pl-10 pr-9 py-2 sm:py-2.5 bg-zinc-900/90 border border-zinc-800 focus:border-amber-500/60 rounded-xl text-base sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('🔥 Trending');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 border border-zinc-800/70 transition-colors shrink-0"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x overscroll-x-contain">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.label || (!activeCategory && cat.query === searchQuery);
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.label);
                    setSearchQuery(cat.query);
                  }}
                  className={`text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full shrink-0 transition-all select-none ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800/80'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content: Organic Masonry Grid - Fills entire remaining vertical space */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3.5 pb-[max(env(safe-area-inset-bottom),0.875rem)] scrollbar-thin scrollbar-thumb-zinc-800">
          {isLoading ? (
            <div className="columns-2 sm:columns-3 gap-2 sm:gap-2.5">
              {[130, 180, 110, 160, 200, 120, 170, 140, 190].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}px` }}
                  className="break-inside-avoid w-full rounded-xl bg-zinc-900/80 border border-zinc-800/40 animate-pulse mb-2 sm:mb-2.5"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-xs sm:text-sm text-rose-400 mb-2">{error}</p>
              <button
                onClick={() => setSearchQuery(searchQuery)}
                className="text-xs sm:text-sm text-amber-400 hover:underline font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 text-center px-4">
              <p className="text-xs sm:text-sm">No GIFs found for &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('🔥 Trending');
                  setSearchQuery('');
                }}
                className="mt-2 text-xs text-amber-400 hover:underline font-medium"
              >
                Back to Trending
              </button>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 gap-2 sm:gap-2.5">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    onSelectGif({
                      providerId: gif.id,
                      previewUrl: gif.images.fixed_height.url,
                    });
                    onClose();
                  }}
                  className="break-inside-avoid w-full block group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/60 hover:border-amber-500/60 transition-all duration-200 hover:scale-[1.015] active:scale-95 shadow-sm mb-2 sm:mb-2.5 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <img
                    src={gif.images.fixed_height.url}
                    alt={gif.title || 'GIF'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover block"
                  />
                  {/* Subtle Gradient & Title on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-2.5 pointer-events-none">
                    <span className="text-[10px] sm:text-[11px] font-medium text-zinc-200 line-clamp-1">
                      {gif.title || 'Select GIF'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
