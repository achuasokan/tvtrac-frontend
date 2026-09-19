"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { updateListDetails } from "../store/listSlice";
import { IList } from "../types";
import { X } from "lucide-react";

interface EditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: IList;
}

export function EditListModal({ isOpen, onClose, list }: EditListModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(list.name);
      setDescription(list.description || "");
      setError("");
    }
  }, [isOpen, list]);

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
      await dispatch(updateListDetails({ 
        listId: list.id, 
        data: { name: name.trim(), description: description.trim() } 
      })).unwrap();
      onClose();
    } catch (err: any) {
      setError(err || "Failed to update list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-28 sm:pb-4"
      onClick={onClose}
    >
      {/* Subtle Translucent Backdrop (allows blurred background to show through) */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] transition-opacity" />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md z-10 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Authentic Frosted Glass Card */}
        <div className="relative bg-black/50 sm:bg-zinc-950/50 backdrop-blur-3xl border border-white/20 rounded-tl-[28px] sm:rounded-tl-[32px] rounded-br-[28px] sm:rounded-br-[32px] rounded-tr-sm rounded-bl-sm shadow-[0_20px_60px_rgba(0,0,0,0.75)] overflow-hidden">
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

          <div className="relative z-10 p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Edit List Details</h2>
                <p className="text-xs text-white/50 mt-0.5">Update list name and description</p>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                aria-label="Close modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">List Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-xl transition-all"
                  placeholder="e.g. Favorites, Anime to Watch"
                />
              </div>
              
              <div>
                <label htmlFor="edit-description" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Description <span className="normal-case font-normal text-zinc-500">(optional)</span></label>
                <textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 backdrop-blur-xl transition-all resize-none h-24"
                  placeholder="What is this list about?"
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || (name.trim() === list.name && description.trim() === (list.description || ""))}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm text-sm font-bold bg-white hover:bg-zinc-100 text-black shadow-lg transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Save Changes"
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
