"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchLists, createNewList, addMovieToList, removeMovieFromList } from "../store/listSlice";

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
      const newList = await dispatch(createNewList({ name: newListName })).unwrap();
      
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-28 sm:pb-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div 
        className="relative w-full max-w-sm z-10 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glass card */}
        <div className="bg-zinc-950/90 border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[80vh]">
          
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 sm:pb-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Save to...</h2>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
            {isLoading && lists.length === 0 ? (
              <div className="flex justify-center py-10">
                <span className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></span>
              </div>
            ) : lists.length > 0 ? (
              <div className="space-y-1.5">
                {lists.map((list) => {
                  const isInList = list.items.some(
                    item => item.tmdbId === tmdbId && item.mediaType === mediaType
                  );
                  
                  return (
                    <button
                      key={list.id}
                      onClick={() => toggleListStatus(list.id, isInList)}
                      disabled={actionLoadingId !== null}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isInList 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]' 
                          : 'border-white/20 group-hover:border-white/40'
                      }`}>
                        {isInList && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="text-white font-medium text-sm truncate">{list.name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{list.items.length} items</p>
                      </div>
                      {actionLoadingId === list.id && (
                        <span className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin shrink-0"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-sm">
                You don't have any lists yet.
              </div>
            )}
          </div>

          {/* Footer / Create New */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-black/20">
            {error && <div className="text-red-400 text-xs mb-3 text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}
            
            {isCreating ? (
              <form onSubmit={handleCreateAndAdd} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newListName.trim() || actionLoadingId === 'new'}
                  className="px-4 py-2.5 bg-white text-black text-sm font-bold rounded-xl disabled:opacity-50 hover:bg-zinc-200 transition-colors shrink-0"
                >
                  {actionLoadingId === 'new' ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin block"></span>
                  ) : (
                    "Create"
                  )}
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors border border-dashed border-white/20 hover:border-white/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New List
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
