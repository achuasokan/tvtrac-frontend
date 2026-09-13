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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-6"
      onClick={onClose}
    >
      {/* Backdrop with frosted dark blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md z-10 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cyber-cinema ticket-cut glass card */}
        <div className="relative bg-[#0b0c0e]/95 border border-zinc-800/90 rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_30px_rgba(45,212,191,0.08)] overflow-hidden flex flex-col max-h-[80vh] backdrop-blur-2xl">
          {/* Top ambient Neon Teal glow accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#2dd4bf]/45 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs bg-[#2dd4bf]/10 border border-[#2dd4bf]/25 flex items-center justify-center text-[#2dd4bf] shadow-[0_0_10px_rgba(45,212,191,0.2)] shrink-0">
                <BookmarkPlus className="w-4 h-4 text-[#2dd4bf]" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight leading-tight">Save to List</h2>
                <p className="text-[11px] text-zinc-400 font-medium">Select custom lists for this title</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose} 
              aria-label="Close modal"
              className="group w-7 h-7 flex items-center justify-center rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-[#2dd4bf]/40 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
            {isLoading && lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2.5">
                <span className="w-6 h-6 border-2 border-zinc-800 border-t-[#2dd4bf] rounded-full animate-spin"></span>
                <span className="text-xs text-zinc-500 font-medium">Loading your lists...</span>
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
                    className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs transition-all duration-200 text-left cursor-pointer border active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                      isInList 
                        ? 'bg-gradient-to-r from-[#2dd4bf]/[0.10] via-teal-950/20 to-zinc-900/60 border-[#2dd4bf]/40 shadow-[0_0_12px_rgba(45,212,191,0.06)]' 
                        : 'bg-zinc-900/40 hover:bg-zinc-850/80 border-zinc-800/80 hover:border-zinc-700/90'
                    }`}
                  >
                    {/* Custom Compact Ticket-Cut Checkbox */}
                    <div className={`w-4 h-4 rounded-tl-[5px] rounded-br-[5px] rounded-tr-[2px] rounded-bl-[2px] flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isInList 
                        ? 'bg-gradient-to-br from-[#2dd4bf] to-teal-500 border border-[#2dd4bf] text-zinc-950 shadow-[0_0_10px_rgba(45,212,191,0.45)]' 
                        : 'border border-zinc-700/80 bg-zinc-950/70 group-hover:border-[#2dd4bf]/60 group-hover:bg-zinc-900'
                    }`}>
                      {isInList ? (
                        <Check className="w-3 h-3 stroke-[3.5] text-zinc-950 animate-in zoom-in duration-150" />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-zinc-700 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </div>

                    {/* Single-Row Compact List Details */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span className={`font-semibold text-xs sm:text-sm truncate tracking-tight transition-colors ${
                        isInList ? 'text-white' : 'text-zinc-200 group-hover:text-white'
                      }`}>
                        {list.name}
                      </span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 transition-colors ${
                        isInList 
                          ? 'bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/25' 
                          : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/40 group-hover:text-zinc-300'
                      }`}>
                        {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Loading status per list */}
                    {isProcessing && (
                      <span className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-[#2dd4bf] rounded-full animate-spin shrink-0"></span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 px-4">
                <div className="w-10 h-10 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto mb-2.5 shadow-inner">
                  <FolderPlus className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-zinc-300">No Lists Created Yet</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs mx-auto">Create your first custom collection below.</p>
              </div>
            )}
          </div>

          {/* Footer / Create New List Action */}
          <div className="p-3 sm:p-3.5 border-t border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md">
            {error && (
              <div className="text-red-400 text-xs mb-2.5 text-center bg-red-500/10 border border-red-500/20 py-1.5 px-3 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs">
                {error}
              </div>
            )}
            
            {isCreating ? (
              <form onSubmit={handleCreateAndAdd} className="space-y-2">
                <div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    maxLength={50}
                    className="w-full bg-zinc-900/90 border border-zinc-700/90 focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/40 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
                    autoFocus
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
                    className="px-2.5 py-1.5 rounded-tl-md rounded-br-md rounded-tr-xs rounded-bl-xs text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-850 border border-transparent hover:border-zinc-700/80 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newListName.trim() || actionLoadingId === 'new'}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#2dd4bf] to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black text-xs font-black tracking-wide rounded-tl-md rounded-br-md rounded-tr-xs rounded-bl-xs shadow-[0_0_12px_rgba(45,212,191,0.25)] hover:shadow-[0_0_16px_rgba(45,212,191,0.4)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoadingId === 'new' ? (
                      <>
                        <span className="w-3 h-3 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin block"></span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 stroke-[2.5]" />
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
                className="group w-full flex items-center justify-center gap-2 py-2 px-3 rounded-tl-lg rounded-br-lg rounded-tr-xs rounded-bl-xs font-bold text-xs uppercase tracking-wider bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-dashed border-zinc-700/90 hover:border-[#2dd4bf]/60 hover:shadow-[0_0_15px_rgba(45,212,191,0.12)] active:scale-[0.99] transition-all duration-200 cursor-pointer"
              >
                <div className="w-4 h-4 rounded bg-[#2dd4bf]/15 border border-[#2dd4bf]/30 flex items-center justify-center text-[#2dd4bf] group-hover:scale-110 group-hover:rotate-90 transition-transform duration-200">
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
