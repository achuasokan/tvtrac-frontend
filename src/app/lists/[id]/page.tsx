"use client";

import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RootState, AppDispatch } from "@/store";
import { fetchLists, removeMovieFromList, reorderListItems, createNewList, addMovieToList } from "@/features/lists/store/listSlice";
import { SearchAndAddModal } from "@/features/lists/components/SearchAndAddModal";
import { CreateListModal } from "@/features/lists/components/CreateListModal";
import { FEATURED_LISTS, CuratedListDef } from "@/features/lists/data/curatedLists";
import { api } from "@/lib/api";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableListItemCard } from "@/features/lists/components/ListItemCard";
import { Toast } from "@/components/ui/Toast";
import { InfiniteScroll } from "@/components/ui/InfiniteScroll";
import { motion } from "framer-motion";

function CuratedListItem({ item, idx, detail }: { item: any; idx: number; detail: any }) {
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const title = detail?.title || detail?.name || "Title";
  const poster = detail?.poster_path ? `https://image.tmdb.org/t/p/w342${detail.poster_path}` : null;
  const rating = detail?.vote_average ? detail.vote_average.toFixed(1) : null;
  const displayRank = item.rank ? item.rank : idx + 1;
  const key = `${item.mediaType}-${item.tmdbId}`;

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min((idx % 24) * 0.03, 0.35),
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
    >
      <Link 
        href={`/title/${item.mediaType}/${item.tmdbId}`}
        className="group relative isolate flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800/80 hover:shadow-xl hover:shadow-[0_8px_30px_rgba(217,138,89,0.15)] transition-all duration-300 h-full"
      >
        {/* Sci-Fi Fading Border Glow */}
        <div 
          className="absolute inset-0 z-40 pointer-events-none rounded-xl border-[1.5px] border-transparent transition-all duration-300 opacity-100 sm:opacity-90 sm:group-hover:opacity-100 sm:group-hover:shadow-[0_0_12px_rgba(217,138,89,0.3)]"
          style={{
            background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.4) 40%, transparent 75%) border-box',
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
            transform: 'translateZ(0)'
          }}
        />

        <div className="aspect-[2/3] w-full relative bg-zinc-800 overflow-hidden">
          {/* Rank Badge on Poster */}
          <div className="absolute bottom-2 right-2 z-10 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] sm:text-[11px] font-black text-white shadow-lg pointer-events-none">
            {displayRank}
          </div>

          {!isImgLoaded && poster && (
            <div className="absolute inset-0 bg-zinc-800/80 animate-pulse" />
          )}

          {poster ? (
            <img 
              src={poster} 
              alt={title} 
              onLoad={() => setIsImgLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                isImgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
              No Poster
            </div>
          )}

          {rating && (
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-white/10 flex items-center gap-0.5">
              ★ {rating}
            </div>
          )}
        </div>

        <div className="p-2 flex items-center justify-between flex-1">
          <h4 className="text-white text-xs font-bold truncate group-hover:text-zinc-200 transition-colors">
            {title}
          </h4>
        </div>
      </Link>
    </motion.div>
  );
}

// Global cache for curated lists to prevent refetching when navigating back
const curatedListCache = new Map<string, any[]>();
const curatedDetailsCache = new Map<string, Record<string, any>>();
const userItemsDetailsCache = new Map<string, any>();

export default function ListDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  
  const isCurated = id?.startsWith("curated-");
  const curatedDef = useMemo(() => FEATURED_LISTS.find(f => f.id === id), [id]);

  const { lists, isLoading } = useSelector((state: RootState) => state.lists);

  const isAlreadyCloned = useMemo(() => {
    if (!isCurated || !curatedDef || !lists) return false;
    return lists.some(l => l.name.trim() === curatedDef.name.trim() && l.description?.includes("[tvtrac curated copy]"));
  }, [isCurated, curatedDef, lists]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [itemsDetails, setItemsDetails] = useState<Record<string, any>>(() => Object.fromEntries(userItemsDetailsCache));
  const [sortBy, setSortBy] = useState<"default" | "first_added" | "last_added" | "az" | "za" | "rating_desc" | "rating_asc">("default");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Curated List Specific State
  const [curatedItems, setCuratedItems] = useState<any[]>([]);
  const [isCuratedLoading, setIsCuratedLoading] = useState(false);
  const [curatedPage, setCuratedPage] = useState(1);
  const [hasMoreCurated, setHasMoreCurated] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch items if this is a Curated Featured List
  useEffect(() => {
    if (!isCurated || !curatedDef) return;

    const cacheKey = curatedDef.id;
    if (curatedListCache.has(cacheKey)) {
      setCuratedItems(curatedListCache.get(cacheKey)!);
      setItemsDetails(prev => ({ ...prev, ...curatedDetailsCache.get(cacheKey)! }));
      setCuratedPage(Math.ceil(curatedListCache.get(cacheKey)!.length / 20));
      setHasMoreCurated(curatedListCache.get(cacheKey)!.length < curatedDef.totalCount);
      return;
    }

    let isMounted = true;
    const fetchCuratedData = async () => {
      setIsCuratedLoading(true);
      try {
        const queryParams = new URLSearchParams({
          type: curatedDef.fetchParams.type,
          page: "1",
          ...curatedDef.fetchParams.params,
        }).toString();
        
        const res = await api.get(`/tmdb/discover/advanced?${queryParams}`);
        const items = res.data?.results || [];
        
        const detailsMap: Record<string, any> = {};
        const formattedItems = items.map((item: any, index: number) => {
          const key = `${curatedDef.fetchParams.type}-${item.id}`;
          detailsMap[key] = item;
          return {
            tmdbId: String(item.id),
            mediaType: curatedDef.fetchParams.type,
            addedAt: new Date().toISOString(),
            rank: index + 1
          };
        });

        if (isMounted) {
          curatedListCache.set(cacheKey, formattedItems);
          curatedDetailsCache.set(cacheKey, detailsMap);
          
          setCuratedItems(formattedItems);
          setItemsDetails((prev) => ({ ...prev, ...detailsMap }));
          setCuratedPage(1);
          setHasMoreCurated(formattedItems.length < curatedDef.totalCount && items.length > 0);
          setIsCuratedLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsCuratedLoading(false);
      }
    };

    fetchCuratedData();
    return () => { isMounted = false; };
  }, [isCurated, curatedDef]);

  const loadMoreCurated = async () => {
    if (!isCurated || !curatedDef || isLoadingMore || !hasMoreCurated) return;
    setIsLoadingMore(true);
    
    const nextPage = curatedPage + 1;
    try {
      const queryParams = new URLSearchParams({
        type: curatedDef.fetchParams.type,
        page: String(nextPage),
        ...curatedDef.fetchParams.params,
      }).toString();
      
      const res = await api.get(`/tmdb/discover/advanced?${queryParams}`);
      const items = res.data?.results || [];
      
      const detailsMap: Record<string, any> = {};
      const newFormattedItems = items.map((item: any, index: number) => {
        const key = `${curatedDef.fetchParams.type}-${item.id}`;
        detailsMap[key] = item;
        return {
          tmdbId: String(item.id),
          mediaType: curatedDef.fetchParams.type,
          addedAt: new Date().toISOString(),
          rank: (nextPage - 1) * 20 + index + 1
        };
      });

      const updatedItems = [...curatedItems, ...newFormattedItems].slice(0, curatedDef.totalCount);
      
      setCuratedItems(updatedItems);
      setItemsDetails(prev => ({ ...prev, ...detailsMap }));
      setCuratedPage(nextPage);
      setHasMoreCurated(updatedItems.length < curatedDef.totalCount && items.length > 0);
      
      const cacheKey = curatedDef.id;
      curatedListCache.set(cacheKey, updatedItems);
      curatedDetailsCache.set(cacheKey, { ...curatedDetailsCache.get(cacheKey), ...detailsMap });
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Clone curated list to personal account
  const handleCloneList = async () => {
    if (!curatedDef || curatedItems.length === 0 || isCloning) return;
    setIsCloning(true);
    try {
      const newList = await dispatch(createNewList({
        name: curatedDef.name,
        description: "[tvtrac curated copy]",
      })).unwrap();

      // Add items sequentially
      for (const item of curatedItems) {
        await dispatch(addMovieToList({
          listId: newList.id,
          data: { tmdbId: item.tmdbId, mediaType: item.mediaType }
        }));
      }

      setToastMessage("Saved to My Lists");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert("Failed to save list to account.");
    } finally {
      setIsCloning(false);
    }
  };

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

  const handleStartReorder = () => {
    if (!list?.items) return;
    setSortBy("default");
    setIsReordering(true);
    setLocalItems(list.items);
    setIsMenuOpen(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => `${item.mediaType}-${item.tmdbId}` === active.id);
        const newIndex = items.findIndex((item) => `${item.mediaType}-${item.tmdbId}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    try {
      await dispatch(reorderListItems({ listId: id, items: localItems })).unwrap();
      setIsReordering(false);
    } catch (err) {
      alert("Failed to save order");
    }
  };

  useEffect(() => {
    if (!isCurated && lists.length === 0) {
      dispatch(fetchLists());
    }
  }, [dispatch, lists.length, isCurated]);

  const list = isCurated ? null : lists.find(l => l.id === id);
  const activeItems = isCurated ? curatedItems : (list?.items || []);
  const isClonedCopy = list?.description?.includes("[tvtrac curated copy]");

  // Filter & Sort Items
  const filteredAndSortedItems = useMemo(() => {
    let items = [...activeItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const details = itemsDetails[`${item.mediaType}-${item.tmdbId}`];
        const title = (details?.title || details?.name || "").toLowerCase();
        return title.includes(q);
      });
    }

    switch (sortBy) {
      case "first_added":
        return items.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      case "last_added":
        return items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      case "rating_desc":
        return items.sort((a, b) => {
          const ratingA = itemsDetails[`${a.mediaType}-${a.tmdbId}`]?.vote_average || 0;
          const ratingB = itemsDetails[`${b.mediaType}-${b.tmdbId}`]?.vote_average || 0;
          return ratingB - ratingA;
        });
      case "rating_asc":
        return items.sort((a, b) => {
          const ratingA = itemsDetails[`${a.mediaType}-${a.tmdbId}`]?.vote_average || 0;
          const ratingB = itemsDetails[`${b.mediaType}-${b.tmdbId}`]?.vote_average || 0;
          return ratingA - ratingB;
        });
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
  }, [activeItems, sortBy, itemsDetails, searchQuery]);

  // User List Specific Batch Pagination State
  const [userVisibleLimit, setUserVisibleLimit] = useState(24);
  const [isLoadingUserBatch, setIsLoadingUserBatch] = useState(false);

  // Batch fetch title details for user custom lists
  useEffect(() => {
    if (!isCurated && list?.items && list.items.length > 0) {
      const fetchMissingBatch = async () => {
        const targetItems = isReordering ? list.items : activeItems.slice(0, userVisibleLimit);
        const missingItems = targetItems.filter((item) => {
          const key = `${item.mediaType}-${item.tmdbId}`;
          return !itemsDetails[key];
        });

        if (missingItems.length === 0) return;

        try {
          const res = await api.post("/tmdb/batch", { items: missingItems });
          if (res.data) {
            Object.entries(res.data).forEach(([k, v]) => userItemsDetailsCache.set(k, v));
            setItemsDetails((prev) => ({ ...prev, ...res.data }));
          }
        } catch (err) {
          console.error("Batch fetch error:", err);
        }
      };

      fetchMissingBatch();
    }
  }, [isCurated, list?.items, activeItems, userVisibleLimit, isReordering]);

  const handleLoadMoreUserList = () => {
    if (isLoadingUserBatch || userVisibleLimit >= filteredAndSortedItems.length) return;
    setIsLoadingUserBatch(true);
    setUserVisibleLimit((prev) => Math.min(prev + 24, filteredAndSortedItems.length));
    setIsLoadingUserBatch(false);
  };



  if (isCurated && !curatedDef) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Featured list not found</h1>
        <button 
          onClick={() => router.push('/lists')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!isCurated && !list) {
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
          onClick={handleStartReorder}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/10 transition-colors text-zinc-300 whitespace-nowrap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Reorder Items
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

  const displayTitle = isCurated ? curatedDef?.name : list?.name;
  const rawDesc = isCurated ? curatedDef?.description : list?.description;
  const displayDescription = rawDesc?.replace("[tvtrac curated copy]", "")?.trim();

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
          <h1 className="text-lg font-bold text-white truncate max-w-[200px] sm:max-w-xs">{displayTitle}</h1>
        </div>
        
        {isCurated ? (
          !isAlreadyCloned && (
            <button
              onClick={handleCloneList}
              disabled={isCloning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-black font-bold rounded-lg text-xs hover:bg-zinc-200 transition-colors shadow-lg disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {isCloning ? "Saving..." : "Save to My Lists"}
            </button>
          )
        ) : (
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors shadow-lg"
            title="Add Movie / Show"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Expanded Header */}
      <div className="pt-4 pb-0 px-4 max-w-7xl mx-auto relative">
        {!isCurated && (
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {isReordering ? (
              <>
                <button
                  onClick={() => setIsReordering(false)}
                  className="px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs bg-zinc-800 text-white shadow-lg tracking-wide uppercase hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrder}
                  className="px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs bg-blue-600 text-white shadow-lg tracking-wide uppercase hover:bg-blue-700 transition-colors"
                >
                  Save Order
                </button>
              </>
            ) : isEditing ? (
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
        )}

        <button 
          onClick={() => router.push('/lists')}
          className="flex items-center justify-center w-8 h-8 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors mb-2"
          title="Back to Lists"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">{displayTitle}</h1>
        
        {isCurated ? (
          <div className="text-zinc-400 text-sm font-medium mb-4 tracking-wide">
            tvtrac curated collection
          </div>
        ) : displayDescription ? (
          <p className="text-zinc-400 mb-4 max-w-2xl text-sm sm:text-base">{displayDescription}</p>
        ) : null}

        {/* Toolbar: Search, Filter, Actions & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/5">
          
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            {/* Search within list */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in this list..."
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {isCurated ? (
              !isAlreadyCloned && (
                <button
                  onClick={handleCloneList}
                  disabled={isCloning}
                  className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg whitespace-nowrap disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{isCloning ? "Saving..." : "Save List"}</span>
                </button>
              )
            ) : (
              <>
                {!isClonedCopy && (
                  <button
                    onClick={() => setIsSearchModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span>Add Item</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-stretch sm:items-center bg-zinc-900/30 border border-zinc-800 rounded-lg shadow-sm w-full sm:w-auto">
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-zinc-400 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase border-r border-zinc-800 whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {filteredAndSortedItems.length} items
            </div>
            
            {/* Custom Sort Dropdown */}
            <div className="relative flex-1 sm:flex-none flex">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between sm:justify-start w-full gap-2 bg-transparent text-zinc-300 text-sm px-3 sm:px-4 py-2 hover:text-white transition-colors outline-none h-full"
              >
                <span className="truncate max-w-[120px] sm:max-w-none text-left">
                  {sortBy === "default" ? "Default Order" : 
                   sortBy === "rating_desc" ? "Highest Rating" :
                   sortBy === "rating_asc" ? "Lowest Rating" :
                   sortBy === "first_added" ? "First Added" : 
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
                    <button onClick={() => { setSortBy("default"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "default" ? "text-white font-bold" : "text-zinc-400"}`}>Default Order</button>
                    <button onClick={() => { setSortBy("rating_desc"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "rating_desc" ? "text-white font-bold" : "text-zinc-400"}`}>Highest Rating</button>
                    <button onClick={() => { setSortBy("rating_asc"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "rating_asc" ? "text-white font-bold" : "text-zinc-400"}`}>Lowest Rating</button>
                    <button onClick={() => { setSortBy("az"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "az" ? "text-white font-bold" : "text-zinc-400"}`}>Alphabetical (A-Z)</button>
                    <button onClick={() => { setSortBy("za"); setIsSortOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${sortBy === "za" ? "text-white font-bold" : "text-zinc-400"}`}>Alphabetical (Z-A)</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isCuratedLoading || (!isCurated && isLoading && lists.length === 0) ? (
          <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
            {[...Array(16)].map((_, idx) => (
              <div key={idx} className="aspect-[2/3] w-full rounded-xl bg-zinc-900/80 border border-zinc-800/60 animate-pulse overflow-hidden" />
            ))}
          </div>
        ) : filteredAndSortedItems.length > 0 ? (
          !isCurated ? (
            <InfiniteScroll
              hasMore={!isReordering && userVisibleLimit < filteredAndSortedItems.length}
              isLoading={isLoadingUserBatch}
              onLoadMore={handleLoadMoreUserList}
            >
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={(isReordering ? localItems : filteredAndSortedItems.slice(0, userVisibleLimit)).map(item => `${item.mediaType}-${item.tmdbId}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                    {(isReordering ? localItems : filteredAndSortedItems.slice(0, userVisibleLimit)).map((item, idx) => {
                      const key = `${item.mediaType}-${item.tmdbId}`;
                      return (
                        <SortableListItemCard 
                          key={key} 
                          id={key}
                          item={item} 
                          listId={id} 
                          details={itemsDetails[key]}
                          isEditing={isEditing}
                          isReordering={isReordering}
                          isSelected={selectedItems.has(key)}
                          onToggleSelect={handleToggleSelect}
                          index={idx}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </InfiniteScroll>
          ) : (
            <InfiniteScroll 
              hasMore={hasMoreCurated} 
              isLoading={isLoadingMore} 
              onLoadMore={loadMoreCurated}
            >
              <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
                {filteredAndSortedItems.map((item, idx) => (
                  <CuratedListItem key={`${item.mediaType}-${item.tmdbId}`} item={item} idx={idx} detail={itemsDetails[`${item.mediaType}-${item.tmdbId}`]} />
                ))}
              </div>
            </InfiniteScroll>
          )
        ) : (
          <div className="text-center py-20 text-zinc-500">
            {searchQuery ? "No matching items found for your search." : "This list is empty."}
          </div>
        )}
      </div>

      {!isCurated && (
        <>
          <SearchAndAddModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            listId={id}
          />

          <CreateListModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            editList={list}
          />
        </>
      )}

      <Toast message={toastMessage} />
    </div>
  );
}
