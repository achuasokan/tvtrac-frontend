import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store";
import { removeMovieFromList } from "@/features/lists/store/listSlice";
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
}

export function ListItemCard({ item, listId, details, isEditing, isReordering, isSelected, onToggleSelect }: ListItemCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [showConfirm, setShowConfirm] = useState(false);
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
      className="relative group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden aspect-[2/3] flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-all cursor-pointer shadow-lg hover:-translate-y-1"
    >
      {!details ? (
        <div className="w-full h-full bg-zinc-800/50 animate-pulse flex flex-col items-center justify-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : details.poster_path ? (
        <img src={`https://image.tmdb.org/t/p/w342${details.poster_path}`} alt={details.title || details.name} className="w-full h-full object-cover" />
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-2 animate-in fade-in zoom-in-95 duration-200">
          <p className="text-white text-xs sm:text-sm font-bold mb-3 tracking-wide">Remove?</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={cancelRemove}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
              title="Cancel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button 
              onClick={confirmRemove}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
              title="Confirm Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
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
      <ListItemCard {...props} />
    </div>
  );
}
