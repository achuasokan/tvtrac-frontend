"use client";

import React, { useMemo } from 'react';
import { Tv, Film, Check } from 'lucide-react';

export interface WatchProviderItem {
  provider_id?: number | string;
  provider_name?: string;
  name?: string;
  logo_path?: string;
}

export interface NetworkItem {
  id?: number | string;
  name?: string;
  logo_path?: string;
}

interface EpisodePlatformSelectorProps {
  watchProviders?: WatchProviderItem[];
  networks?: NetworkItem[];
  selectedPlatform: string | null;
  onSelect: (platform: string | null) => void;
  className?: string;
}

interface NormalizedPlatform {
  id: string;
  canonicalKey: string;
  displayName: string;
  logoUrl?: string;
  isFallback?: boolean;
}

function getCanonicalPlatform(rawName: string): { canonicalKey: string; displayName: string } {
  const trimmed = rawName.trim();
  // Strip "(with Ads)" or "with Ads" or "(Channel)" or "Channel"
  const cleaned = trimmed
    .replace(/\s*\((?:with\s+ads|ads|channel)\)/gi, '')
    .replace(/\s+with\s+ads/gi, '')
    .trim();

  const lower = cleaned.toLowerCase();

  if (
    lower.includes('amazon') ||
    lower.includes('prime video') ||
    lower === 'prime'
  ) {
    return { canonicalKey: 'prime-video', displayName: 'Prime Video' };
  }
  if (lower.includes('apple tv') || lower.includes('apple tv+')) {
    return { canonicalKey: 'apple-tv-plus', displayName: 'Apple TV+' };
  }
  if (lower.includes('disney') || lower.includes('disney+')) {
    return { canonicalKey: 'disney-plus', displayName: 'Disney+' };
  }
  if (lower.includes('paramount') || lower.includes('paramount+')) {
    return { canonicalKey: 'paramount-plus', displayName: 'Paramount+' };
  }
  if (lower === 'hbo max' || lower === 'max' || lower === 'hbo') {
    return { canonicalKey: 'max', displayName: 'Max' };
  }
  if (lower.includes('netflix')) {
    return { canonicalKey: 'netflix', displayName: 'Netflix' };
  }
  if (lower.includes('hulu')) {
    return { canonicalKey: 'hulu', displayName: 'Hulu' };
  }
  if (lower.includes('peacock')) {
    return { canonicalKey: 'peacock', displayName: 'Peacock' };
  }
  if (lower.includes('hotstar') || lower.includes('jio cinema') || lower.includes('jiocinema')) {
    return { canonicalKey: 'jiocinema', displayName: cleaned || 'JioCinema' };
  }

  return { canonicalKey: lower, displayName: cleaned };
}

const DEFAULT_POPULAR_PLATFORMS = [
  { id: 'Netflix', canonicalKey: 'netflix', displayName: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg' },
  { id: 'Prime Video', canonicalKey: 'prime-video', displayName: 'Prime Video', logoUrl: 'https://image.tmdb.org/t/p/w92/pvsGq0z4WjbeJ6y55i0d3wFj24.jpg' },
  { id: 'Apple TV+', canonicalKey: 'apple-tv-plus', displayName: 'Apple TV+', logoUrl: 'https://image.tmdb.org/t/p/w92/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  { id: 'Max', canonicalKey: 'max', displayName: 'Max', logoUrl: 'https://image.tmdb.org/t/p/w92/7eqf2hJ3k4a5Y7mI12J34z0.jpg' },
  { id: 'Disney+', canonicalKey: 'disney-plus', displayName: 'Disney+', logoUrl: 'https://image.tmdb.org/t/p/w92/97yvRBw1GzX7fMzH6Z12Y3.jpg' },
  { id: 'Hulu', canonicalKey: 'hulu', displayName: 'Hulu', logoUrl: 'https://image.tmdb.org/t/p/w92/zxrVdFjPBqikq25Ejw6gY4k0.jpg' },
];

export function EpisodePlatformSelector({
  watchProviders = [],
  networks = [],
  selectedPlatform,
  onSelect,
  className = '',
}: EpisodePlatformSelectorProps) {
  const platforms = useMemo(() => {
    const list: NormalizedPlatform[] = [];
    const seenKeys = new Set<string>();

    // 1. Official streaming providers for this title & country from TMDB/JustWatch
    watchProviders.forEach((wp) => {
      const raw = wp.provider_name || wp.name;
      if (!raw) return;
      const { canonicalKey, displayName } = getCanonicalPlatform(raw);
      if (!seenKeys.has(canonicalKey)) {
        seenKeys.add(canonicalKey);
        list.push({
          id: displayName,
          canonicalKey,
          displayName,
          logoUrl: wp.logo_path ? `https://image.tmdb.org/t/p/w92${wp.logo_path}` : undefined,
        });
      }
    });

    // 2. Official networks (e.g. HBO, Apple TV+, AMC, BBC)
    networks.forEach((net) => {
      const raw = net.name;
      if (!raw) return;
      const { canonicalKey, displayName } = getCanonicalPlatform(raw);
      if (!seenKeys.has(canonicalKey)) {
        seenKeys.add(canonicalKey);
        list.push({
          id: displayName,
          canonicalKey,
          displayName,
          logoUrl: net.logo_path ? `https://image.tmdb.org/t/p/w92${net.logo_path}` : undefined,
        });
      }
    });

    // If no real providers were discovered, provide top popular fallbacks
    if (list.length === 0) {
      DEFAULT_POPULAR_PLATFORMS.forEach((p) => {
        if (!seenKeys.has(p.canonicalKey)) {
          seenKeys.add(p.canonicalKey);
          list.push(p);
        }
      });
    }

    // 3. Universal broadcast and other fallbacks
    list.push({ id: 'TV / Cable', canonicalKey: 'tv-cable', displayName: 'TV / Cable', isFallback: true });
    list.push({ id: 'Other', canonicalKey: 'other', displayName: 'Other', isFallback: true });

    return list;
  }, [watchProviders, networks]);

  const selectedCanonicalKey = selectedPlatform ? getCanonicalPlatform(selectedPlatform).canonicalKey : null;

  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x ${className}`}>
      {platforms.map((platform) => {
        const isSelected =
          selectedPlatform === platform.displayName ||
          selectedPlatform === platform.id ||
          (selectedCanonicalKey !== null && selectedCanonicalKey === platform.canonicalKey);

        return (
          <button
            key={platform.canonicalKey}
            type="button"
            onClick={() => onSelect(isSelected ? null : platform.displayName)}
            className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold transition-all shrink-0 select-none active:scale-95 border cursor-pointer ${
              isSelected
                ? 'bg-[#2dd4bf]/15 border-[#2dd4bf]/70 text-white shadow-[0_0_12px_rgba(45,212,191,0.2)]'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800/80 hover:border-zinc-700'
            }`}
          >
            {platform.logoUrl ? (
              <img
                src={platform.logoUrl}
                alt={platform.displayName}
                className="w-4 h-4 rounded-md object-cover shrink-0 shadow-sm"
                loading="lazy"
              />
            ) : platform.canonicalKey === 'tv-cable' ? (
              <Tv className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2dd4bf]' : 'text-zinc-400'}`} />
            ) : (
              <Film className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2dd4bf]' : 'text-zinc-400'}`} />
            )}

            <span className="whitespace-nowrap font-medium tracking-tight">{platform.displayName}</span>

            {isSelected && (
              <Check className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0 stroke-[2.5]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
