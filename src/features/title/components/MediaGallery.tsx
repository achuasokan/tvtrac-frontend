"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Image as ImageIcon, ChevronRight, X, Grid2X2 } from 'lucide-react';
import type { BackdropItem } from './MediaLightbox';

const MediaLightbox = dynamic(() => import('./MediaLightbox'), {
  ssr: false,
});

interface MediaGalleryProps {
  images?: BackdropItem[];
  titleName?: string;
  dominantColor?: string | null;
}

const MOBILE_PREVIEW = 6;
const INITIAL_LIMIT = 8;

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  images = [],
  titleName,
  dominantColor,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showMobileSheet, setShowMobileSheet] = useState(false);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (showMobileSheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileSheet]);

  if (!images || images.length === 0) return null;

  const desktopDisplayed = showAll ? images : images.slice(0, INITIAL_LIMIT);
  const mobilePreview = images.slice(0, MOBILE_PREVIEW);
  const hasMore = images.length > INITIAL_LIMIT;

  return (
    <div className="w-full max-w-5xl mx-auto my-4 sm:my-6 px-0 sm:px-2">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-zinc-400" />
          <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Official Wallpapers &amp; Stills
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 tabular-nums">
            ({images.length})
          </span>
        </div>

        {/* Mobile: opens bottom sheet | Desktop: expand in-place */}
        {images.length > MOBILE_PREVIEW && (
          <button
            onClick={() => {
              // On mobile use sheet; on desktop toggle in-place
              if (window.innerWidth < 640) {
                setShowMobileSheet(true);
              } else {
                setShowAll(!showAll);
              }
            }}
            className="text-[11px] sm:text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span className="sm:hidden">View all ({images.length})</span>
            <span className="hidden sm:inline">
              {showAll ? 'Show less' : `View all (${images.length})`}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 hidden sm:block ${showAll ? '-rotate-90' : 'rotate-90'}`}
            />
          </button>
        )}
      </div>

      {/* ── Mobile: Fixed-count horizontal carousel ── */}
      <div className="sm:hidden -mx-4 px-4 flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1">
        {mobilePreview.map((image, index) => (
          <div
            key={image.file_path || index}
            onClick={() => setLightboxIndex(index)}
            className="snap-start shrink-0 w-[260px] aspect-video rounded-xl overflow-hidden bg-zinc-900/80 border border-white/5 relative group cursor-pointer active:scale-[0.98] transition-transform shadow-md"
            role="button"
            tabIndex={0}
            aria-label={`View wallpaper ${index + 1} of ${images.length}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightboxIndex(index);
              }
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w780${image.file_path}`}
              alt={titleName ? `${titleName} still ${index + 1}` : `Still ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
          </div>
        ))}
      </div>

      {/* ── Desktop: Responsive Grid ── */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {desktopDisplayed.map((image, index) => (
          <div
            key={image.file_path || index}
            onClick={() => setLightboxIndex(index)}
            className="aspect-video rounded-xl overflow-hidden bg-zinc-900/80 border border-white/5 relative group cursor-pointer transition-all duration-300 hover:border-zinc-700 shadow-md hover:shadow-xl"
            role="button"
            tabIndex={0}
            aria-label={`View wallpaper ${index + 1} of ${images.length}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightboxIndex(index);
              }
            }}
          >
            <img
              src={`https://image.tmdb.org/t/p/w780${image.file_path}`}
              alt={titleName ? `${titleName} still ${index + 1}` : `Still ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
          </div>
        ))}
      </div>

      {/* ── Mobile: Full-screen bottom sheet "View All" modal ── */}
      {showMobileSheet && (
        <div className="sm:hidden fixed inset-0 z-[9999] flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobileSheet(false)}
          />

          {/* Sheet panel — slides up from bottom */}
          <div className="relative mt-auto w-full max-h-[92dvh] bg-zinc-950 rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden animate-[slideUp_0.28s_cubic-bezier(0.32,0.72,0,1)]">
            {/* Handle + header */}
            <div className="flex-shrink-0 pt-3 pb-2 px-4">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid2X2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-sm font-bold text-white">Wallpapers &amp; Stills</span>
                  <span className="text-xs text-zinc-500">({images.length})</span>
                </div>
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable image grid */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 20px))' }}>
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {images.map((image, index) => (
                  <div
                    key={image.file_path || index}
                    onClick={() => {
                      setShowMobileSheet(false);
                      setTimeout(() => setLightboxIndex(index), 50);
                    }}
                    className="aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.06] relative cursor-pointer active:scale-[0.97] transition-transform"
                    role="button"
                    tabIndex={0}
                    aria-label={`View wallpaper ${index + 1}`}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w780${image.file_path}`}
                      alt={titleName ? `${titleName} still ${index + 1}` : `Still ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Dialog */}
      {lightboxIndex !== null && (
        <MediaLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
          titleName={titleName}
        />
      )}
    </div>
  );
};

export default MediaGallery;
