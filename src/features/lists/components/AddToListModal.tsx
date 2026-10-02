"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchLists, createNewList, addMovieToList, removeMovieFromList } from "../store/listSlice";
import { BookmarkPlus, Check, Plus, X, FolderPlus } from "lucide-react";

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tmdbId: string;
  mediaType: 'movie' | 'tv';
}

export function AddToListModal({ isOpen, onClose, tmdbId, mediaType }: AddToListModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { lists, isLoading } = useSelector((state: RootState) => state.lists);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchLists());
      setIsCreating(false);
      setNewListName("");
      setError("");
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) {
      setError("List name is required");
      return;
    }
    
    setError("");
    setActionLoadingId('new');
    
    try {
      // Create the list
      const newList = await dispatch(createNewList({ name: newListName.trim() })).unwrap();
      
      // Add item to it
      await dispatch(addMovieToList({ 
        listId: newList.id, 
        data: { tmdbId, mediaType } 
      })).unwrap();
      
      // Reset form instead of closing modal
      setNewListName("");
      setIsCreating(false);
    } catch (err: any) {
      setError(err || "Failed to create list and add item");
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleListStatus = async (listId: string, isCurrentlyInList: boolean) => {
    setActionLoadingId(listId);
    setError("");
    
    try {
      if (isCurrentlyInList) {
        await dispatch(removeMovieFromList({ 
          listId, 
          data: { tmdbId, mediaType } 
        })).unwrap();
      } else {
        await dispatch(addMovieToList({ 
          listId, 
          data: { tmdbId, mediaType } 
        })).unwrap();
      }
    } catch (err: any) {
      setError(err || "Failed to update list");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Subtle Translucent Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-[320px] sm:max-w-[360px] z-10 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Authentic Frosted Glass Card with Uniform Smooth Rounded Corners */}
        <div className="relative bg-zinc-950/95 backdrop-blur-3xl border border-white/15 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col">
          {/* Brand Signature Fading Bottom Border Glow */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none rounded-2xl sm:rounded-3xl border-[1.5px] border-transparent"
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

          {/* Header */}
          <div className="relative z-10 px-3.5 py-3 sm:px-4 sm:py-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-md shadow-sm">
                <BookmarkPlus className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">Save to List</h2>
                <p className="text-[11px] text-white/50">Select custom lists for this title</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              aria-label="Close modal"
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* List Content (Reduced Height Scrollable Window showing ~4 items) */}
          <div className="relative z-10 max-h-[175px] sm:max-h-[195px] overflow-y-auto overscroll-contain p-2.5 sm:p-3 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/50 [&::-webkit-scrollbar-track]:bg-white/[0.04] [&::-webkit-scrollbar-track]:rounded-full">
            {isLoading && lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span className="text-xs text-white/50 font-medium">Loading your lists...</span>
              </div>
            ) : lists.length > 0 ? (
              lists.map((list) => {
                const isInList = list.items.some(
                  item => item.tmdbId === tmdbId && item.mediaType === mediaType
                );
                const isProcessing = actionLoadingId === list.id;
                
                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => toggleListStatus(list.id, isInList)}
                    disabled={actionLoadingId !== null}
                    className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-left cursor-pointer border backdrop-blur-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                      isInList 
                        ? 'bg-white/[0.14] border-white/35 text-white shadow-sm ring-1 ring-white/20' 
                        : 'bg-white/[0.04] hover:bg-white/[0.10] border-white/[0.08] hover:border-white/25 text-white/75'
                    }`}
                  >
                    {/* Custom Compact Checkbox */}
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isInList 
                        ? 'bg-white text-black shadow-sm' 
                        : 'border border-white/25 bg-white/[0.06] group-hover:border-white/50'
                    }`}>
                      {isInList ? (
                        <Check className="w-3 h-3 stroke-[3.5] text-black animate-in zoom-in duration-150" />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    {/* Single-Row Compact List Details */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span className={`font-semibold text-xs truncate tracking-tight transition-colors ${
                        isInList ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {list.name}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium shrink-0 transition-colors ${
                        isInList 
                          ? 'bg-white/20 text-white border border-white/30' 
                          : 'bg-white/10 text-white/50 border border-white/10 group-hover:text-white/70'
                      }`}>
                        {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Loading status per list */}
                    {isProcessing && (
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-6 px-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-white/50 mx-auto mb-2">
                  <FolderPlus className="w-4 h-4 text-white/50" />
                </div>
                <p className="text-xs font-bold text-zinc-200">No Lists Created Yet</p>
                <p className="text-[10px] text-white/50 mt-0.5 max-w-xs mx-auto">Create your first custom collection below.</p>
              </div>
            )}
          </div>

          {/* Footer / Create New List Action */}
          <div className="relative z-10 p-2.5 sm:p-3 border-t border-white/10 bg-white/[0.02] backdrop-blur-md">
            {error && (
              <div className="text-red-400 text-xs mb-2.5 text-center bg-red-500/10 border border-red-500/20 py-1.5 px-3 rounded-xl">
                {error}
              </div>
            )}
            
            {isCreating ? (
              <form onSubmit={handleCreateAndAdd} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    maxLength={50}
                    className="w-full bg-white/[0.05] border border-white/[0.12] focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none backdrop-blur-xl transition-all"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewListName("");
                      setError("");
                    }}
                    className="cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newListName.trim() || actionLoadingId === 'new'}
                    className="cursor-pointer px-4 py-1.5 bg-white hover:bg-zinc-100 text-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {actionLoadingId === 'new' ? (
                      <>
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin block"></span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Create & Add</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="group w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-dashed border-white/20 hover:border-white/40 active:scale-[0.99] transition-all backdrop-blur-xl cursor-pointer"
              >
                <div className="w-4 h-4 rounded-md bg-white/15 border border-white/30 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-90 transition-transform duration-200">
                  <Plus className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span>Create New List</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
