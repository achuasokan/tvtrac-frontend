"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Star, Calendar } from "lucide-react";
import { extractDominantColor } from "@/utils/colorExtractor";

export default function CollectionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [collection, setCollection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dominantColor, setDominantColor] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/tmdb/collection/${id}`);
        
        // Sort parts by release date
        if (res.data && res.data.parts) {
          res.data.parts.sort((a: any, b: any) => {
            if (!a.release_date) return 1;
            if (!b.release_date) return -1;
            return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
          });
        }
        
        setCollection(res.data);

        // Extract dominant color from poster or backdrop
        const imgPath = res.data.poster_path || res.data.backdrop_path || res.data.parts?.[0]?.poster_path;
        if (imgPath) {
          const imgUrl = `https://image.tmdb.org/t/p/w500${imgPath}`;
          extractDominantColor(imgUrl).then(color => {
            if (color) setDominantColor(color);
          }).catch(err => console.error("Color extraction failed:", err));
        }
      } catch (error) {
        console.error("Failed to fetch collection details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCollection();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <p>Collection not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative pb-24 outline-none">
      {/* Top Navigation Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md' : 'bg-transparent'}`}>
        <div className="h-16 md:h-20 px-4 sm:px-6 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 transition-colors flex items-center justify-center"
            style={{ border: 'none', outline: 'none' }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <h2 className={`text-sm sm:text-base font-bold tracking-widest uppercase text-white transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
            {collection.name}
          </h2>
          
          <div className="w-10" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
        {(collection.backdrop_path || collection.parts?.[0]?.backdrop_path) ? (
          <img 
            src={`https://image.tmdb.org/t/p/original${collection.backdrop_path || collection.parts?.[0]?.backdrop_path}`}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" />
        )}
        
        {/* Gradients for smooth fade into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent opacity-80" />
        
        {/* Hero Content */}
        <div className="absolute bottom-0 inset-x-0 px-4 sm:px-8 md:px-16 pb-6 md:pb-10 max-w-[2000px] mx-auto flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-10 items-start md:items-end">
          {collection.poster_path && (
            <img 
              src={`https://image.tmdb.org/t/p/w500${collection.poster_path}`}
              alt={collection.name}
              className="w-24 sm:w-48 md:w-64 rounded-xl shadow-2xl border border-white/10 shrink-0 block"
            />
          )}
          
          <div className="flex flex-col gap-2 md:gap-4 max-w-4xl">
            <span 
              className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase drop-shadow-md transition-colors duration-700"
              style={{ color: dominantColor || '#22d3ee' }}
            >
              Collection
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-white drop-shadow-xl leading-tight">
              {collection.name}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-zinc-300 max-w-3xl leading-relaxed mt-2 drop-shadow-md">
              {collection.overview}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                {collection.parts?.length || 0} Movies
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Timeline / Grid */}
      <div className="px-4 sm:px-8 md:px-16 max-w-[2000px] mx-auto mt-6 md:mt-10">
        
        <div className="flex items-center gap-4 mb-8 sm:mb-12">
          <div 
            className="h-8 w-1.5 rounded-full transition-colors duration-700 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
            style={{ backgroundColor: dominantColor || '#06b6d4', boxShadow: dominantColor ? `0 0 15px ${dominantColor}80` : undefined }}
          />
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">Timeline Order</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
          {collection.parts?.map((part: any, index: number) => (
            <Link 
              href={`/title/movie/${part.id}`} 
              key={part.id}
              className="group relative flex flex-col gap-2"
            >
              <div 
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-black border-[1.5px] flex items-center justify-center font-black text-[10px] z-10 shadow-lg transition-colors duration-700"
                style={{ borderColor: dominantColor || '#06b6d4', color: dominantColor || '#22d3ee', boxShadow: dominantColor ? `0 0 10px ${dominantColor}40` : undefined }}
              >
                {index + 1}
              </div>
              
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-white/20 transition-colors shadow-lg group-hover:shadow-xl">
                {part.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${part.poster_path}`} 
                    alt={part.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2 p-4 text-center">
                    <span className="font-bold text-sm">{part.title}</span>
                  </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="flex flex-col px-1">
                <h3 className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-white transition-colors truncate">
                  {part.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{part.release_date ? part.release_date.substring(0,4) : 'TBA'}</span>
                  </div>
                  {part.vote_average > 0 && (
                    <div 
                      className="flex items-center gap-1 transition-colors duration-700"
                      style={{ color: dominantColor || '#06b6d4' }}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold">{part.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
