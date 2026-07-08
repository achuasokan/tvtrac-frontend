import React from 'react';

interface ShowProgressBarProps {
  watchedCount: number;
  totalCount: number;
}

export default function ShowProgressBar({ watchedCount, totalCount }: ShowProgressBarProps) {
  if (totalCount === 0 || watchedCount === 0) return null;
  
  // Calculate percentage, capping at 100% just in case of data anomalies
  const rawPercentage = (watchedCount / totalCount) * 100;
  const percentage = Math.min(Math.round(rawPercentage), 100);
  
  return (
    <div className="w-full max-w-sm mx-auto mt-6 mb-2">
      <div className="flex justify-end items-end mb-2 px-1">
        <span className="text-[11px] font-bold text-white">
          {watchedCount} <span className="text-zinc-500 font-normal">/ {totalCount}</span>
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 0 && percentage < 100 && (
             <div className="absolute top-0 right-0 bottom-0 w-6 bg-white shadow-[0_0_12px_4px_rgba(255,255,255,0.8)] blur-[2px]"></div>
          )}
        </div>
      </div>
    </div>
  );
}
