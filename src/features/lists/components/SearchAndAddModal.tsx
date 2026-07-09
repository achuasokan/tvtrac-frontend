"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { addMovieToList, removeMovieFromList } from "@/features/lists/store/listSlice";
import { api } from "@/lib/api";

interface SearchAndAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
}

export function SearchAndAddModal({ isOpen, onClose, listId }: SearchAndAddModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { lists } = useSelector((state: RootState) => state.lists);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const currentList = lists.find(l => l.id === listId);

  const isAdded = (id: string) => {
    return currentList?.items.some((i: any) => i.tmdbId.toString() === id.toString());
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasInteracted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          // The backend route is /tmdb/search?q=...
          const res = await api.get(`/tmdb/search?q=${encodeURIComponent(query)}`);
          setResults(res.data.results || []);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  const handleToggle = async (item: any) => {
    const idStr = item.id.toString();
    const mediaType = item.media_type === 'tv' ? 'tv' : 'movie';
    setProcessingId(idStr);
    setHasInteracted(true);
    try {
      if (isAdded(idStr)) {
        await dispatch(removeMovieFromList({
          listId,
          data: { tmdbId: idStr, mediaType }
        })).unwrap();
      } else {
        await dispatch(addMovieToList({
          listId,
          data: { tmdbId: idStr, mediaType }
        })).unwrap();
      }
    } catch (error) {
      console.error("Failed to toggle item", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh] shadow-2xl">
        
        {/* Header & Search */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Add to List</h3>
            {hasInteracted ? (
              <button 
                onClick={onClose}
                className="px-4 py-1.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors shadow-lg"
              >
                Done
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="text-zinc-500 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies or TV shows..."
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[350px] relative flex flex-col">
          {isLoading && results.length === 0 ? (
            <div className="absolute inset-0 flex justify-center items-center">
              <span className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin"></span>
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                  <div className="w-12 h-16 bg-zinc-800 rounded-md shrink-0 overflow-hidden relative">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{item.title || item.name}</h4>
                    <p className="text-zinc-400 text-xs truncate">
                      {item.media_type === 'tv' ? 'TV Show' : 'Movie'} • {(item.release_date || item.first_air_date || '').split('-')[0]}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggle(item)}
                    disabled={processingId === item.id.toString()}
                    className={`shrink-0 p-2 rounded-full transition-colors flex items-center justify-center
                      ${isAdded(item.id.toString()) 
                        ? 'bg-blue-600 hover:bg-red-500 text-white' 
                        : 'bg-white/10 hover:bg-white hover:text-black text-white'}`}
                    title={isAdded(item.id.toString()) ? "Remove from list" : "Add to list"}
                  >
                    {processingId === item.id.toString() ? (
                      <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    ) : isAdded(item.id.toString()) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="flex justify-center items-center h-full text-zinc-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-zinc-500 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              Search to add movies and shows
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
