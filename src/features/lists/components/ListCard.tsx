import { useEffect, useState } from "react";
import Link from "next/link";
import { IList } from "../types";
import { api } from "@/lib/api";

interface ListCardProps {
  list: IList;
  onDelete?: (id: string) => void;
}

export function ListCard({ list, onDelete }: ListCardProps) {
  const [posters, setPosters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPosters = async () => {
      if (!list.items || list.items.length === 0) {
        if (isMounted) setIsLoading(false);
        return;
      }
      
      try {
        const top3 = list.items.slice(0, 3);
        const fetchedPosters = await Promise.all(
          top3.map(async (item) => {
            try {
              const res = await api.get(`/tmdb/title/${item.mediaType}/${item.tmdbId}`);
              return res.data?.poster_path 
                ? `https://image.tmdb.org/t/p/w200${res.data.poster_path}` 
                : null;
            } catch (err) {
              return null;
            }
          })
        );
        
        if (isMounted) {
          setPosters(fetchedPosters.filter(Boolean) as string[]);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchPosters();
    return () => { isMounted = false; };
  }, [list.items]);

  return (
    <div className="relative group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col h-[200px]">
      <Link href={`/lists/${list.id}`} className="absolute inset-0 z-10" aria-label={`View ${list.name}`} />
      
      {/* Decorative top cover */}
      <div className="absolute top-0 left-0 right-0 h-[60%] overflow-hidden bg-zinc-950/50">
        {!isLoading && posters.length > 0 ? (
          <div className="flex w-full h-full">
            {posters.map((poster, idx) => (
              <div 
                key={idx} 
                className="flex-1 h-full relative"
              >
                <div className="absolute inset-0 bg-black/20 z-10" />
                <img 
                  src={poster} 
                  alt="Poster" 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-900 to-transparent z-10 pointer-events-none" />
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-end z-20 pointer-events-none mt-auto">
        <div>
          <h3 className="text-white font-bold text-lg truncate group-hover:text-blue-400 transition-colors drop-shadow-md">
            {list.name}
          </h3>
          {list.description && (
            <p className="text-zinc-400 text-sm mt-0.5 line-clamp-1 drop-shadow-sm">
              {list.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs font-semibold text-zinc-300 bg-zinc-800/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-zinc-700/50">
            {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
          </span>
          
          {onDelete && (
            <button 
              onClick={(e) => {
                e.preventDefault(); // Prevent navigating to list
                if (window.confirm("Are you sure you want to delete this list?")) {
                  onDelete(list.id);
                }
              }}
              className="text-zinc-500 hover:text-red-500 p-1.5 rounded-full hover:bg-red-500/10 transition-colors z-30 relative pointer-events-auto bg-zinc-900/50 backdrop-blur-sm"
              aria-label="Delete list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
