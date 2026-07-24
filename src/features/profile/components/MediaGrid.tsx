'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CarouselItem, TmdbItem, fetchProfileMediaBatch } from './MediaCarousel';

interface MediaGridProps {
  items: CarouselItem[];
  emptyMessage?: string;
}

export function MediaGrid({ items, emptyMessage = "No items to display" }: MediaGridProps) {
  const router = useRouter();
  const [results, setResults] = useState<TmdbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadItems = async () => {
      if (!items || items.length === 0) {
        if (isMounted) {
            setResults([]);
            setIsLoading(false);
        }
        return;
      }
      
      try {
        const data = await fetchProfileMediaBatch(items);
        if (isMounted) {
          setResults(data);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) setIsLoading(false);
      }
    };
    
    loadItems();
    return () => { isMounted = false; };
  }, [items]);

  if (!isLoading && results.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/50 rounded-2xl border border-zinc-800/80 mt-8">
              <p className="text-zinc-500 text-lg">{emptyMessage}</p>
          </div>
      );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 mt-8">
      {isLoading ? (
          [...Array(10)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse w-full">
                <div className="relative aspect-[2/3] w-full rounded-xl bg-zinc-800/80 border border-zinc-800/60 shadow-lg" />
              </div>
            ))
      ) : (
          results.map((item, idx) => (
              <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min((idx % 12) * 0.03, 0.3),
                    ease: [0.21, 0.47, 0.32, 0.98]
                  }}
                  className="group cursor-pointer flex flex-col gap-2 w-full" 
                  onClick={() => router.push(`/title/${item.media_type}/${item.id}`)}
              >
                  {/* Poster */}
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 shadow-lg group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300">
                      {item.poster_path ? (
                          <img
                              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover animate-in fade-in duration-300"
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
                      <div className="absolute inset-0 bg-black/60 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
              </motion.div>
          ))
      )}
    </div>
  );
}
