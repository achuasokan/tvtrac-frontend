"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchLists, deleteList } from "@/features/lists/store/listSlice";
import { ListCard } from "@/features/lists/components/ListCard";
import { CreateListModal } from "@/features/lists/components/CreateListModal";
import { BottomNav } from "@/components/layout/BottomNav";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { FEATURED_LISTS } from "@/features/lists/data/curatedLists";
import { CuratedListCard } from "@/features/lists/components/CuratedListCard";
import { motion } from "framer-motion";

export default function ListsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { lists, isLoading } = useSelector((state: RootState) => state.lists);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<any>(null);
  const [listToDelete, setListToDelete] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchLists());
  }, [dispatch]);

  const handleDelete = (id: string) => {
    setListToDelete(id);
  };

  const confirmDelete = () => {
    if (listToDelete) {
      dispatch(deleteList(listToDelete));
      setListToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        
        {/* Featured Lists Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">Featured Lists</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">Curated collections by tvtrac</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURED_LISTS.map((curatedList, idx) => (
              <motion.div
                key={curatedList.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.05,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                <CuratedListCard curatedList={curatedList} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* My Lists Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">My Lists</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New List
            </button>
          </div>

        {isLoading && lists.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full aspect-video rounded-2xl bg-zinc-800/50 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : lists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {lists.map((list, idx) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.35,
                  delay: idx * 0.05,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                <ListCard 
                  list={list} 
                  onDelete={handleDelete} 
                  onEdit={(listToEdit) => {
                    setListToEdit(listToEdit);
                    setIsCreateModalOpen(true);
                  }} 
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-medium text-white mb-2">No lists yet</h3>
            <p className="text-zinc-400 max-w-sm mx-auto mb-6">
              Create your first list to start organizing your favorite movies and TV shows.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer text-white bg-zinc-800 hover:bg-zinc-700 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Create a List
            </button>
          </div>
        )}
        </section>
      </div>

      <CreateListModal 
        isOpen={isCreateModalOpen} 
        onClose={() => {
          setIsCreateModalOpen(false);
          setListToEdit(null);
        }} 
        editList={listToEdit}
      />

      <ConfirmModal
        isOpen={!!listToDelete}
        title="Delete List"
        message="Are you sure you want to delete this list? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setListToDelete(null)}
      />

      <BottomNav />
    </div>
  );
}
