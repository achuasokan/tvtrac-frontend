"use client";

import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import { buildExternalLinks, ExternalLinkItem } from '../utils/buildExternalLinks';

interface ExternalLinksHubProps {
  details: any;
  dominantColor?: string | null;
}

export const ExternalLinksHub: React.FC<ExternalLinksHubProps> = ({ details }) => {
  const links = buildExternalLinks(details);

  if (links.length === 0) {
    return null;
  }

  const renderIcon = (type: ExternalLinkItem['type']) => {
    switch (type) {
      case 'imdb':
        return (
          <span className="bg-[#f5c518] text-black font-black px-1.5 py-0.5 rounded text-[10px] tracking-tight font-sans leading-none">
            IMDb
          </span>
        );
      case 'homepage':
        return <Globe className="w-3.5 h-3.5 text-zinc-300" />;
      case 'wikidata':
        return (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#339966]">
            <path d="M0 4.09h1.597v15.82H0zm3.193 0h1.596v15.82H3.193zm3.194 0h1.596v15.82H6.387zm3.194 0h1.596v15.82H9.581zm3.193 0h1.597v15.82h-1.597zm3.194 0h1.596v15.82h-1.596zm3.193 0h1.597v15.82H19.16zm3.194 0H24v15.82h-1.646z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#E4405F]">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-4 sm:my-6 px-0 sm:px-2 text-center">
      <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">
        External Links & Official Profiles
      </span>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            aria-label={`Open ${link.label} in a new tab`}
          >
            {renderIcon(link.type)}
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ExternalLinksHub;
