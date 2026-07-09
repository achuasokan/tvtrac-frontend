"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { createNewList } from "../store/listSlice";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateListModal({ isOpen, onClose }: CreateListModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
      const newList = await dispatch(createNewList({ name, description })).unwrap();
      setName("");
      setDescription("");
      onClose();
      router.push(`/lists/${newList.id}`);
    } catch (err: any) {
      setError(err || "Failed to create list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Create New List</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1">List Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="e.g. Favorites, Anime to Watch"
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-1">Description (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none h-24"
                placeholder="What is this list about?"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex items-center gap-3 mt-6 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                ) : (
                  "Create List"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
