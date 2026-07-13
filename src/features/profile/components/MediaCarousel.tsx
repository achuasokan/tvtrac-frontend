'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface CarouselItem {
  tmdbId: string;
  mediaType: 'movie' | 'tv';
  // Optional extra data for history
  watchedAt?: string;
}

interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface MediaCarouselProps {
  title: React.ReactNode;
  items: CarouselItem[];
  emptyMessage?: string;
}

export function MediaCarousel({ title, items, emptyMessage = "No items to display" }: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchItems = async () => {
      if (!items || items.length === 0) {
        if (isMounted) setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const fetchedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const res = await api.get(`/tmdb/title/${item.mediaType}/${item.tmdbId}`);
              return { ...res.data, media_type: item.mediaType } as TmdbItem;
            } catch (err) {
              return null;
            }
          })
        );
        
        if (isMounted) {
          setResults(fetchedItems.filter(Boolean) as TmdbItem[]);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchItems();
    return () => { isMounted = false; };
  }, [items]);
  
  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const amount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: scrollLeft + (dir === 'left' ? -amount : amount),
        behavior: 'smooth'
      });
    }
  };

  if (!isLoading && results.length === 0) {
      return (
          <div className="mb-10">
              <h2 className="text-xl font-bold tracking-tight text-white mb-4">{title}</h2>
              <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
                  <p className="text-zinc-500 text-sm">{emptyMessage}</p>
              </div>
          </div>
      );
  }

  return (
    <div className="group relative mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        <div className="flex items-center bg-[#18181b] rounded-full border border-zinc-800/80 overflow-hidden shadow-sm">
          <button onClick={() => scroll('left')} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-px h-4 bg-zinc-700/50" />
          <button onClick={() => scroll('right')} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4"
      >
        {isLoading ? (
            [...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2 animate-pulse min-w-[140px] sm:min-w-[160px] md:min-w-[180px] snap-start">
                  <div className="relative aspect-[2/3] w-full rounded-xl bg-zinc-800 shadow-lg" />
                  <div>
                    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-1.5 mt-1"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                  </div>
                </div>
              ))
        ) : (
            results.map(item => (
                <div key={item.id} className="group/card cursor-pointer flex flex-col gap-2 min-w-[140px] sm:min-w-[160px] md:min-w-[180px] snap-start" onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}>
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover/card:scale-105 group-hover/card:shadow-2xl transition-all duration-300">
                        {item.poster_path ? (
                            <img 
                                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                                alt={item.title || item.name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800">No Image</div>
                        )}
                        
                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex gap-1.5 z-10">
                        {item.vote_average ? (
                            <div className="bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-[10px] font-bold text-white">{item.vote_average.toFixed(1)}</span>
                            </div>
                        ) : null}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        
                        {/* Add Button - Always visible on mobile, hover-only on desktop */}
                        <button 
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center transition-all duration-300 z-20 shadow-lg md:opacity-0 md:scale-75 md:group-hover/card:opacity-100 md:group-hover/card:scale-100"
                        title="Add to List"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        </button>
                    </div>

                    {/* Title */}
                    <div>
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-200 truncate group-hover/card:text-white transition-colors">
                        {item.title || item.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                                {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                            <span className="text-[10px] text-zinc-500 font-medium">
                                {item.release_date ? item.release_date.split('-')[0] : (item.first_air_date ? item.first_air_date.split('-')[0] : '')}
                            </span>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
