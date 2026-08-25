import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { removeMovieFromList } from "@/features/lists/store/listSlice";
import { motion } from "framer-motion";
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ListItemCardProps {
  item: any;
  listId: string;
  details: any;
  isEditing: boolean;
  isReordering?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (key: string) => void;
  index?: number;
}

export function ListItemCard({ item, listId, details, isEditing, isReordering, isSelected, onToggleSelect, index }: ListItemCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
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
        if (isReordering) {
          e.preventDefault();
          return;
        }
        if (isEditing) {
          e.preventDefault();
          onToggleSelect?.(`${item.mediaType}-${item.tmdbId}`);
        } else if (!showConfirm) {
          router.push(`/title/${item.mediaType}/${item.tmdbId}`);
        }
      }}
      className="relative group isolate bg-zinc-900 border border-zinc-800/80 rounded-xl overflow-hidden aspect-[2/3] flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(217,138,89,0.15)] hover:-translate-y-1"
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

      {!details ? (
        <div className="w-full h-full bg-zinc-900/60 animate-pulse flex items-center justify-center p-4" />
      ) : details.poster_path ? (
        <div className="w-full h-full bg-zinc-900 relative overflow-hidden">
          {!isImgLoaded && (
            <div className="absolute inset-0 bg-zinc-800/80 animate-pulse" />
          )}
          <img 
            src={`https://image.tmdb.org/t/p/w342${details.poster_path}`} 
            alt={details.title || details.name} 
            onLoad={() => setIsImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isImgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`} 
          />
        </div>
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

      {/* Reorder Overlay */}
      {isReordering && (
        <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center pointer-events-none rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
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
        <div className="absolute inset-0 bg-[#020617]/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-3 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <p className="text-white text-xs sm:text-sm font-bold mb-3 tracking-wide">Remove title?</p>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={cancelRemove}
              className="px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-semibold rounded-xl transition-all hover:scale-105"
              title="Cancel"
            >
              Cancel
            </button>
            <button 
              onClick={confirmRemove}
              className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:scale-105"
              title="Confirm Remove"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SortableListItemCard(props: any & { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, disabled: !props.isReordering });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...(props.isReordering ? attributes : {})} {...(props.isReordering ? listeners : {})} className={props.isReordering ? 'touch-none cursor-grab active:cursor-grabbing' : ''}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.25,
          delay: Math.min(((props.index || 0) % 24) * 0.015, 0.2),
          ease: [0.21, 0.47, 0.32, 0.98]
        }}
      >
        <ListItemCard {...props} />
      </motion.div>
    </div>
  );
}
