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
      
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Save to...</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading && lists.length === 0 ? (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></span>
            </div>
          ) : lists.length > 0 ? (
            <div className="space-y-1">
              {lists.map((list) => {
                const isInList = list.items.some(
                  item => item.tmdbId === tmdbId && item.mediaType === mediaType
                );
                
                return (
                  <button
                    key={list.id}
                    onClick={() => toggleListStatus(list.id, isInList)}
                    disabled={actionLoadingId !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group disabled:opacity-50"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isInList 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-zinc-600 group-hover:border-zinc-400'
                    }`}>
                      {isInList && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-white font-medium text-sm truncate">{list.name}</p>
                      <p className="text-zinc-500 text-xs">{list.items.length} items</p>
                    </div>
                    {actionLoadingId === list.id && (
                      <span className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin"></span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">
              You don't have any lists yet.
            </div>
          )}
        </div>

        {/* Footer / Create New */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          {error && <div className="text-red-500 text-xs mb-3 text-center">{error}</div>}
          
          {isCreating ? (
            <form onSubmit={handleCreateAndAdd} className="flex items-center gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newListName.trim() || actionLoadingId === 'new'}
                className="px-3 py-2 bg-white text-black text-sm font-medium rounded-lg disabled:opacity-50"
              >
                Create
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
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
  );
}
