"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { addMovieToList, removeMovieFromList } from "@/features/lists/store/listSlice";
import { api } from "@/lib/api";
import { X } from "lucide-react";

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
  const [trending, setTrending] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string, alt: string } | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const currentList = lists.find(l => l.id === listId);

  const isAdded = (id: string) => {
    return currentList?.items.some((i: any) => i.tmdbId.toString() === id.toString());
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasInteracted(false);
      setPage(1);
      setHasMore(false);
    } else if (query.trim() === "" && trending.length === 0) {
      const fetchTrending = async () => {
        setIsLoadingTrending(true);
        try {
          const res = await api.get('/tmdb/trending');
          setTrending(res.data.results || []);
        } catch (error) {
          console.error("Failed to fetch trending:", error);
        } finally {
          setIsLoadingTrending(false);
        }
      };
      fetchTrending();
    }
  }, [isOpen, query]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          const res = await api.get(`/tmdb/search?q=${encodeURIComponent(query)}&page=1`);
          setResults(res.data.results || []);
          setHasMore(res.data.page < res.data.total_pages);
          setPage(1);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setHasMore(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await api.get(`/tmdb/search?q=${encodeURIComponent(query)}&page=${nextPage}`);
      setResults(prev => {
        const newResults = res.data.results || [];
        const existingIds = new Set(prev.map(item => item.id));
        const deduplicated = newResults.filter((item: any) => !existingIds.has(item.id));
        return [...prev, ...deduplicated];
      });
      setHasMore(res.data.page < res.data.total_pages);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
  const renderItem = (item: any) => (
    <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/50 transition-colors group">
      <div 
        className="w-12 h-16 bg-zinc-800 rounded-md shrink-0 overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-white/50 transition-all"
        onClick={() => {
          if (item.poster_path) {
            setPreviewImage({ url: item.poster_path, alt: item.title || item.name });
          }
        }}
        title="Click to view full poster"
      >
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
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-6" onClick={onClose}>
      {/* Subtle Translucent Backdrop (allows blurred background to show through) */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] transition-opacity" />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-lg z-10 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Authentic Frosted Glass Card */}
        <div className="relative bg-black/50 sm:bg-zinc-950/50 backdrop-blur-3xl border border-white/20 rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm shadow-[0_20px_60px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col max-h-[78vh]">
          {/* Brand Signature Fading Bottom Border Glow */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm border-[1.5px] border-transparent"
            style={{
              background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.3) 40%, transparent 75%) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out',
              maskComposite: 'exclude'
            }}
          />

          {/* Specular Top Edge Highlight */}
          <div 
            className="absolute top-0 inset-x-0 h-[1px] pointer-events-none z-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%)'
            }}
          />
          
          {/* Header & Search */}
          <div className="relative z-10 p-5 border-b border-white/10 shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Add to List</h3>
              {hasInteracted ? (
                <button 
                  onClick={onClose}
                  className="cursor-pointer px-4 py-1.5 bg-white hover:bg-zinc-100 text-black text-xs font-bold rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm shadow-md transition-all active:scale-95"
                >
                  Done
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  aria-label="Close modal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies or TV shows..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-xl transition-all"
              />
            </div>
          </div>

        {/* Results */}
        <div className="relative z-10 flex-1 overflow-y-auto hide-scrollbar p-2 min-h-[350px] flex flex-col">
          {isLoading ? (
            <div className="flex flex-col gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                  <div className="w-12 h-16 bg-zinc-800 rounded-md shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim().length >= 2 && results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').map(renderItem)}
              
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="mt-2 w-full py-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 font-medium transition-colors border border-white/5 flex items-center justify-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin"></span>
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              )}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="flex justify-center items-center h-full text-zinc-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="flex flex-col">
              <h4 className="text-zinc-500 font-bold text-[11px] uppercase tracking-wider px-2 mb-2 mt-1">Trending This Week</h4>
              {isLoadingTrending ? (
                <div className="flex flex-col gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                      <div className="w-12 h-16 bg-zinc-800 rounded-md shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                        <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : trending.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {trending.filter(r => r.media_type === 'movie' || r.media_type === 'tv').map(renderItem)}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Full-screen Image Preview Overlay */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
          onClick={() => setPreviewImage(null)}
          title="Click anywhere to close"
        >
          <img 
            src={`https://image.tmdb.org/t/p/w500${previewImage.url}`} 
            alt={previewImage.alt} 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
