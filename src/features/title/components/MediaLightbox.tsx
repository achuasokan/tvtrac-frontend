"use client";

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export interface BackdropItem {
  file_path: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  vote_average?: number;
}

interface MediaLightboxProps {
  images: BackdropItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  titleName?: string;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  images,
  currentIndex,
  onClose,
  onNavigate,
  titleName,
}) => {
  const currentImage = images[currentIndex];
  const touchStartX = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);


  const handleDownload = useCallback(async () => {
    if (!currentImage?.file_path || isDownloading) return;

    const url = `https://image.tmdb.org/t/p/original${currentImage.file_path}`;
    const ext = currentImage.file_path.split('.').pop() || 'jpg';
    const slug = titleName
      ? titleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'wallpaper';
    const filename = `${slug}-wallpaper-${currentIndex + 1}.${ext}`;

    try {
      setIsDownloading(true);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error('Downloaded image is empty');
      }

      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      // Give the browser time to start the download.
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [currentImage, isDownloading]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    onNavigate(prevIndex);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIndex = (currentIndex + 1) % images.length;
    onNavigate(nextIndex);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose]);

  // Preload only the immediate NEXT high-res image (ONLY after lightbox is mounted)
  useEffect(() => {
    if (images.length > 1) {
      const nextIndex = (currentIndex + 1) % images.length;
      const nextImage = images[nextIndex];
      if (nextImage?.file_path) {
        const img = new Image();
        img.src = `https://image.tmdb.org/t/p/original${nextImage.file_path}`;
      }
    }
  }, [currentIndex, images]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;

    if (Math.abs(deltaX) > 45) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
    touchStartX.current = null;
  };

  if (!currentImage || !mounted) return null;

  const originalUrl = `https://image.tmdb.org/t/p/original${currentImage.file_path}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Lightbox Container */}
      <div
        className="relative w-full max-w-6xl max-h-[95vh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 text-zinc-400 text-xs sm:text-sm font-medium z-10">
          {/* Image Counter & Resolution */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="bg-zinc-800/80 text-zinc-200 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold tabular-nums border border-white/5">
              {currentIndex + 1} / {images.length}
            </span>
            {currentImage.width && currentImage.height && (
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden xs:inline">
                {currentImage.width} × {currentImage.height}
              </span>
            )}
          </div>

          {/* Actions: Download & Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white transition-colors text-[11px] sm:text-xs font-medium border border-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              title="Download full resolution image"
              aria-label="Download image"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition-colors border border-white/5 cursor-pointer"
              aria-label="Close lightbox (Escape)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div className="relative w-full max-h-[75vh] sm:max-h-[82vh] flex items-center justify-center overflow-hidden rounded-xl bg-black/40">
          <img
            src={originalUrl}
            alt={titleName ? `${titleName} backdrop ${currentIndex + 1}` : `Backdrop ${currentIndex + 1}`}
            className="max-w-full max-h-[75vh] sm:max-h-[82vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300"
            loading="eager"
          />

          {/* Navigation Prev Button — desktop only */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-200 active:scale-95 cursor-pointer shadow-lg"
              aria-label="Previous image (Left arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Navigation Next Button — desktop only */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white items-center justify-center backdrop-blur-sm border border-white/10 transition-all duration-200 active:scale-95 cursor-pointer shadow-lg"
              aria-label="Next image (Right arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>


      </div>
    </div>,
    document.body
  );
};

export default MediaLightbox;
