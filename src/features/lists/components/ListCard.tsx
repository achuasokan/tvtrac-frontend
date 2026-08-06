import { useEffect, useState } from "react";
import Link from "next/link";
import { IList } from "../types";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface ListCardProps {
  list: IList;
  onDelete?: (id: string) => void;
  onEdit?: (list: IList) => void;
}

export function ListCard({ list, onDelete, onEdit }: ListCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: postersData, isLoading } = useQuery({
    queryKey: ['list-cover', list.id],
    queryFn: async () => {
      if (!list.items || list.items.length === 0) return [];
      
      const top3 = list.items.slice(0, 3);
      const fetchedPosters = await Promise.all(
        top3.map(async (item) => {
          try {
            const res = await api.get(`/tmdb/title/${item.mediaType}/${item.tmdbId}`);
            if (res.data?.backdrop_path) {
              return `https://image.tmdb.org/t/p/w780${res.data.backdrop_path}`;
            } else if (res.data?.poster_path) {
              return `https://image.tmdb.org/t/p/w500${res.data.poster_path}`;
            }
            return null;
          } catch (err) {
            return null;
          }
        })
      );
      
      return fetchedPosters.filter(Boolean) as string[];
    },
    enabled: list.items && list.items.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const posters = postersData || [];

  return (
    <div className="group relative isolate w-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-xl hover:shadow-[0_8px_30px_rgba(254,215,184,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
      
      {/* Sci-Fi Fading Border Glow - Always Visible & Fills Corners */}
      <div 
        className={`absolute inset-0 z-40 pointer-events-none rounded-2xl border-[1.5px] border-transparent transition-all duration-300 ${
          isMenuOpen 
            ? 'opacity-100 shadow-[0_0_20px_rgba(217,138,89,0.6)]' 
            : 'opacity-90 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(217,138,89,0.3)]'
        }`}
        style={{
          background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.4) 40%, transparent 75%) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          maskComposite: 'exclude',
          transform: 'translateZ(0)'
        }}
      />

      {/* Inner Image Wrapper with overflow-hidden */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {/* Background Image / Loading State */}
      {isLoading ? (
        <div className="w-full h-full bg-zinc-800/50 animate-pulse flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : posters.length > 0 ? (
        <div className="flex w-full h-full">
          {posters.map((poster, idx) => (
            <div key={idx} className="flex-1 h-full relative overflow-hidden">
              <img 
                src={poster} 
                alt="Poster" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 animate-in fade-in duration-300"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}

        {/* Protective Gradient just for text readability at the very bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
      </div>

      <Link href={`/lists/${list.id}`} className="absolute inset-0 z-10" aria-label={`View ${list.name}`} />

      {/* List Name Inside Image */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <h3 className="text-white font-black text-xl md:text-2xl truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#fed7b8] transition-all duration-300">
          {list.name}
        </h3>
      </div>

      {/* 3-Dot Options Menu */}
      {(onDelete || onEdit) && (
        <div className="absolute top-3 right-3 z-30" onMouseLeave={() => setIsMenuOpen(false)}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="cursor-pointer text-white p-1.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 shadow-lg border border-white/10"
            aria-label="Options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute top-full right-0 pt-2 w-36 z-50">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                {onEdit && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit(list);
                    }}
                    className="cursor-pointer w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-medium"
                  >
                    Edit Details
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      if (onDelete) onDelete(list.id);
                    }}
                    className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium"
                  >
                    Delete List
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
