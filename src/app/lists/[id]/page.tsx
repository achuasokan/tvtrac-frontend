"use client";

import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store";
import { fetchLists, removeMovieFromList } from "@/features/lists/store/listSlice";
import { SearchAndAddModal } from "@/features/lists/components/SearchAndAddModal";
import { EditListModal } from "@/features/lists/components/EditListModal";
import { api } from "@/lib/api";

function ListItemCard({ item, listId, details, isEditing, isSelected, onToggleSelect }: { item: any, listId: string, details: any, isEditing: boolean, isSelected?: boolean, onToggleSelect?: (key: string) => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) {
      dispatch(removeMovieFromList({ listId, data: { tmdbId: item.tmdbId, mediaType: item.mediaType } }));
    } else {
      setShowConfirm(true);
    }
  };

  const confirmRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeMovieFromList({ listId, data: { tmdbId: item.tmdbId, mediaType: item.mediaType } }));
    setShowConfirm(false);
  };

  const cancelRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div 
      onClick={(e) => { 
        if (isEditing) {
          e.preventDefault();
          onToggleSelect?.(`${item.mediaType}-${item.tmdbId}`);
        } else if (!showConfirm) {
          router.push(`/title/${item.mediaType}/${item.tmdbId}`);
        }
      }}
      className="relative group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden aspect-[2/3] flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-all cursor-pointer shadow-lg hover:-translate-y-1"
    >
      {!details ? (
        <div className="w-full h-full bg-zinc-800/50 animate-pulse flex flex-col items-center justify-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : details.poster_path ? (
        <img src={`https://image.tmdb.org/t/p/w342${details.poster_path}`} alt={details.title || details.name} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-white font-bold mb-1">{details.title || details.name}</div>
          <div className="text-zinc-500 text-xs uppercase tracking-wider">{item.mediaType}</div>
        </div>
      )}
      
      {/* Selection Overlay in Edit Mode */}
      {isEditing && (
        <div className={`absolute inset-0 z-10 transition-colors pointer-events-none ${isSelected ? 'bg-black/20 border-2 border-red-500 rounded-xl' : 'bg-black/40'}`}>
           <div className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${isSelected ? 'bg-red-500 text-white' : 'bg-black/60 text-white/50 border border-white/50'}`}>
             {isSelected ? (
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             ) : (
               <div className="h-4 w-4 rounded-full" />
             )}
           </div>
        </div>
      )}

      {/* Remove button (Desktop Hover - only when NOT editing) */}
      {!isEditing && !showConfirm && (
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 backdrop-blur-md text-white rounded-full transition-all shadow-xl z-10 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
          title="Remove from list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Confirm Modal Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-white text-xs sm:text-sm font-bold mb-3 tracking-wide">Remove?</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={cancelRemove}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
              title="Cancel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button 
              onClick={confirmRemove}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
              title="Confirm Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ListDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const { lists, isLoading } = useSelector((state: RootState) => state.lists);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [itemsDetails, setItemsDetails] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<"default" | "last_added" | "az" | "za">("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleSelect = (key: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleBulkDelete = () => {
    selectedItems.forEach(key => {
      const [mediaType, tmdbId] = key.split('-');
      dispatch(removeMovieFromList({ listId: id, data: { tmdbId: String(tmdbId), mediaType: mediaType as 'movie' | 'tv' } }));
    });
    setSelectedItems(new Set());
    setIsEditing(false);
  };

  // Also auto-open modal if they just created it. 
  // For simplicity, we just use the existing add button.

  useEffect(() => {
    if (lists.length === 0) {
      dispatch(fetchLists());
    }
  }, [dispatch, lists.length]);

  const list = lists.find(l => l.id === id);

  useEffect(() => {
    if (list?.items) {
      const fetchMissingDetails = async () => {
        const promises = list.items.map(async (item) => {
          const key = `${item.mediaType}-${item.tmdbId}`;
          if (!itemsDetails[key]) {
            try {
              const res = await api.get(`/tmdb/title/${item.mediaType}/${item.tmdbId}`);
              return { key, data: res.data };
            } catch (err) {
              return { key, data: null };
            }
          }
          return null;
        });

        const results = await Promise.all(promises);
        const newDetails: Record<string, any> = {};
        let hasNew = false;
        results.forEach(res => {
          if (res) {
            newDetails[res.key] = res.data;
            hasNew = true;
          }
        });
        
        if (hasNew) {
          setItemsDetails(prev => ({ ...prev, ...newDetails }));
        }
      };
      fetchMissingDetails();
    }
  }, [list?.items]);

  const sortedItems = useMemo(() => {
    if (!list?.items) return [];
    const items = [...list.items];
    
    switch (sortBy) {
      case "last_added":
        return items.reverse();
      case "az":
      case "za":
        return items.sort((a, b) => {
          const titleA = (itemsDetails[`${a.mediaType}-${a.tmdbId}`]?.title || itemsDetails[`${a.mediaType}-${a.tmdbId}`]?.name || "").toLowerCase();
          const titleB = (itemsDetails[`${b.mediaType}-${b.tmdbId}`]?.title || itemsDetails[`${b.mediaType}-${b.tmdbId}`]?.name || "").toLowerCase();
          if (sortBy === "az") return titleA.localeCompare(titleB);
          return titleB.localeCompare(titleA);
        });
      case "default":
      default:
        return items;
    }
  }, [list?.items, sortBy, itemsDetails]);

  if (isLoading && lists.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">List not found</h1>
        <button 
          onClick={() => router.push('/lists')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const renderOptionsMenu = () => (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
      <div className="absolute right-0 top-full mt-2 w-max min-w-[160px] bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
        <button 
          onClick={() => { setIsEditModalOpen(true); setIsMenuOpen(false); }} 
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors text-zinc-300 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Details
        </button>
        <button 
          onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} 
          className="w-full sm:hidden flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors text-red-500 font-medium mt-1 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove Items
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Compact Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-lg transition-all duration-300 flex items-center justify-between h-16 px-4 max-w-7xl mx-auto ${isScrolled ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-4'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/lists')}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-xs">{list.name}</h1>
        </div>
        
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-lg"
          title="Add Movie / Show"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Main Expanded Header (Scrolls normally) */}
      <div className="pt-2 pb-0 px-4 max-w-7xl mx-auto relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => { setIsEditing(false); setSelectedItems(new Set()); }}
                className="px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs bg-zinc-800 text-white shadow-lg tracking-wide uppercase hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs bg-red-600 text-white shadow-lg tracking-wide uppercase hover:bg-red-700 transition-colors"
                >
                  Delete ({selectedItems.size})
                </button>
              )}
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-900 border border-zinc-800 text-white shadow-lg hover:bg-zinc-800 transition-colors"
                title="List Options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </button>
              {isMenuOpen && renderOptionsMenu()}
            </div>
          )}
        </div>

        <button 
          onClick={() => router.push('/lists')}
          className="flex items-center justify-center w-8 h-8 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors mb-2"
          title="Back to Lists"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">{list.name}</h1>
        
        {list.description && (
          <p className="text-zinc-400 mb-4 max-w-2xl text-sm sm:text-base">{list.description}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 w-full sm:w-auto relative">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-black px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="truncate">Add <span className="hidden sm:inline">Movie / Show</span></span>
            </button>
          </div>

          <div className="flex items-stretch sm:items-center bg-zinc-900/30 border border-zinc-800 rounded-lg shadow-sm w-full sm:w-auto">
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-zinc-400 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase border-r border-zinc-800 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {list.items.length} {(() => {
                if (list.items.length === 0) return 'items';
                const hasMovies = list.items.some((i: any) => i.mediaType === 'movie');
                const hasShows = list.items.some((i: any) => i.mediaType === 'tv');
                if (hasMovies && !hasShows) return list.items.length === 1 ? 'movie' : 'movies';
                if (!hasMovies && hasShows) return list.items.length === 1 ? 'show' : 'shows';
                return list.items.length === 1 ? 'item' : 'items';
              })()}
            </div>
            
            {/* Custom Sort Dropdown */}
            <div className="relative flex-1 sm:flex-none flex">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between sm:justify-start w-full gap-2 bg-transparent text-zinc-300 text-sm px-3 sm:px-4 py-2 hover:text-white transition-colors outline-none h-full"
              >
                <span className="truncate max-w-[120px] sm:max-w-none text-left">
                  {sortBy === "default" ? "User Order" : 
                   sortBy === "last_added" ? "Latest Added" : 
                   sortBy === "az" ? "A-Z" : "Z-A"}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform flex-shrink-0 ${isSortOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isSortOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                  <div className="absolute right-0 left-0 sm:left-auto top-full mt-2 sm:w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={() => { setSortBy("default"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "default" ? "text-white font-bold" : "text-zinc-400"}`}>User Order / First Added</button>
                    <button onClick={() => { setSortBy("last_added"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "last_added" ? "text-white font-bold" : "text-zinc-400"}`}>Latest Added</button>
                    <button onClick={() => { setSortBy("az"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "az" ? "text-white font-bold" : "text-zinc-400"}`}>Alphabetical (A-Z)</button>
                    <button onClick={() => { setSortBy("za"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "za" ? "text-white font-bold" : "text-zinc-400"}`}>Alphabetical (Z-A)</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {sortedItems.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {sortedItems.map((item) => {
              const key = `${item.mediaType}-${item.tmdbId}`;
              return (
                <ListItemCard 
                  key={key} 
                  item={item} 
                  listId={id} 
                  details={itemsDetails[key]}
                  isEditing={isEditing}
                  isSelected={selectedItems.has(key)}
                  onToggleSelect={handleToggleSelect}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            This list is empty. Add some movies or shows!
          </div>
        )}
      </div>

      <SearchAndAddModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        listId={id}
      />

      <EditListModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        list={list}
      />
    </div>
  );
}
