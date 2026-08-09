"use client";

import { useState } from "react";
import { FALLBACK_POSTERS } from "@/lib/constants/posters";

interface MoviePosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function MoviePoster({ src, alt, className = "", fallbackSrc }: MoviePosterProps) {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (src && src.trim() !== "") return src;
    return fallbackSrc || FALLBACK_POSTERS[0];
  });
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const randomFallback = FALLBACK_POSTERS[Math.floor(Math.random() * FALLBACK_POSTERS.length)];
      setImgSrc(fallbackSrc || randomFallback);
    }
  };

  if (!imgSrc) return null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      draggable={false}
    />
  );
}
