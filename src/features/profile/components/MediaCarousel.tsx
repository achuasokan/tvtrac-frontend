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
  viewAllLink?: string;
}

export function MediaCarousel({ title, items, emptyMessage = "No items to display", viewAllLink }: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScroll, setCanScroll] = useState(false);

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
  
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        setCanScroll(scrollRef.current.scrollWidth > scrollRef.current.clientWidth);
      }
    };
    // Check after a tiny delay to ensure DOM is updated with new items
    const timeout = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkScroll);
    };
  }, [results, isLoading]);

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
              <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
                  <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
              </div>
              <div className="px-4 sm:px-6 lg:px-8">
                  <p className="text-zinc-500 text-sm">{emptyMessage}</p>
              </div>
          </div>
      );
  }

  return (
    <div className="group relative mb-10">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-end gap-4">
            <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
            {viewAllLink && (
                <button 
                    onClick={() => router.push(viewAllLink)}
                    className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-1"
                >
                    View All &rsaquo;
                </button>
            )}
        </div>
        {canScroll && (
            <div className="hidden md:flex items-center bg-[#18181b] rounded-full border border-zinc-800/80 overflow-hidden shadow-sm">
            <button onClick={() => scroll('left')} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-px h-4 bg-zinc-700/50" />
            <button onClick={() => scroll('right')} className="cursor-pointer w-9 h-7 hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
            </div>
        )}
      </div>
      <div 
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4 px-4 sm:px-6 lg:px-8"
      >
        {isLoading ? (
            [...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col gap-2 animate-pulse w-[110px] sm:w-[130px] md:w-[150px] lg:w-[160px] shrink-0 snap-start">
                  <div className="relative aspect-[2/3] w-full rounded-xl bg-zinc-800 shadow-lg" />
                </div>
              ))
        ) : (
            results.map(item => (
                <div key={item.id} className="group/card cursor-pointer flex flex-col gap-2 w-[110px] sm:w-[130px] md:w-[150px] lg:w-[160px] shrink-0 snap-start" onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}>
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover/card:scale-105 group-hover/card:shadow-2xl transition-all duration-300">
                        {item.poster_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                alt={item.title || item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-800 text-xs">No Image</div>
                        )}

                        {/* Rating Badge */}
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
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
