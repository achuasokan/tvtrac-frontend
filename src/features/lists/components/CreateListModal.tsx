"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { createNewList, updateListDetails } from "../store/listSlice";
import { IList } from "../types";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  editList?: IList | null;
}

export function CreateListModal({ isOpen, onClose, editList }: CreateListModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setName(editList?.name || "");
      setDescription(editList?.description || "");
      setError("");
    }
  }, [isOpen, editList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("List name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      if (editList) {
        await dispatch(updateListDetails({ listId: editList.id, data: { name, description } })).unwrap();
        onClose();
      } else {
        const newList = await dispatch(createNewList({ name, description })).unwrap();
        setName("");
        setDescription("");
        onClose();
        router.push(`/lists/${newList.id}`);
      }
    } catch (err: any) {
      setError(err || `Failed to ${editList ? 'update' : 'create'} list`);
    } finally {
      setIsSubmitting(false);
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
        <div className="relative bg-zinc-950/90 border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Sci-Fi Fading Border Glow */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none rounded-3xl border-[1.5px] border-transparent"
            style={{
              background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.3) 40%, transparent 75%) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'destination-out',
              maskComposite: 'exclude'
            }}
          />

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editList ? "Edit List" : "New List"}
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {editList ? "Update your list details" : "Create a new collection"}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="cursor-pointer text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-full hover:bg-white/5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  List Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                  placeholder="e.g. Favorites, Anime to Watch"
                  autoFocus
                />
              </div>
              
              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Description <span className="normal-case font-normal text-zinc-600">(optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none h-20"
                  placeholder="What is this list about?"
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-zinc-100 text-black shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    editList ? "Save Changes" : "Create List"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
