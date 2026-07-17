import React from 'react';

interface RatingsBarProps {
  tmdbRating?: number;
  tmdbVotes?: number;
  omdb?: {
    imdbRating?: string;
    imdbVotes?: string;
    Ratings?: { Source: string; Value: string }[];
  };
}

const formatVotes = (votes: number | string) => {
  if (!votes) return '';
  if (typeof votes === 'string') {
    // IMDB votes come as "6,800"
    const parsed = parseInt(votes.replace(/,/g, ''), 10);
    if (isNaN(parsed)) return votes;
    votes = parsed;
  }
  
  if (votes >= 1000000) return (votes / 1000000).toFixed(1) + 'M';
  if (votes >= 1000) return (votes / 1000).toFixed(1) + 'k';
  return votes.toString();
};

export const RatingsBar: React.FC<RatingsBarProps> = ({ tmdbRating, tmdbVotes, omdb }) => {
  const getRating = (source: string) => {
    return omdb?.Ratings?.find(r => r.Source === source)?.Value || null;
  };

  const rtRating = getRating('Rotten Tomatoes');
  const mcRating = getRating('Metacritic');

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-8 w-full mt-2 mb-6">
      
      {/* TMDB Rating */}
      {tmdbRating !== undefined && tmdbRating > 0 && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-[46px] sm:h-[46px] bg-[#0a0a0a] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-zinc-800 shadow-sm shrink-0">
            <div className="flex flex-col items-start leading-[0.85] text-[#01b4e4] font-black tracking-tighter ml-0.5 sm:ml-1">
              <span className="text-[7px] sm:text-[9px]">THE</span>
              <span className="text-[7px] sm:text-[9px]">MOVIE</span>
              <span className="text-[8px] sm:text-[10px] text-[#90cea1]">DB</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-base sm:text-xl leading-none">{tmdbRating.toFixed(1)}</span>
            {tmdbVotes !== undefined && <span className="text-zinc-400 text-[10px] sm:text-sm font-medium mt-1">{formatVotes(tmdbVotes)}</span>}
          </div>
        </div>
      )}

      {/* IMDb Rating */}
      {omdb?.imdbRating && omdb.imdbRating !== "N/A" && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-[46px] sm:h-[46px] bg-[#0a0a0a] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-zinc-800 shadow-sm shrink-0">
            <div className="bg-[#F5C518] px-1 sm:px-1.5 py-0.5 rounded-sm sm:rounded-[4px]">
              <span className="text-black font-black text-[9px] sm:text-[11px] tracking-tighter leading-none">IMDb</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-base sm:text-xl leading-none">{omdb.imdbRating}</span>
            {omdb.imdbVotes && omdb.imdbVotes !== "N/A" && <span className="text-zinc-400 text-[10px] sm:text-sm font-medium mt-1">{formatVotes(omdb.imdbVotes)}</span>}
          </div>
        </div>
      )}

      {/* Rotten Tomatoes */}
      {rtRating && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-[46px] sm:h-[46px] bg-[#0a0a0a] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-zinc-800 shadow-sm shrink-0">
            {parseInt(rtRating) >= 60 ? (
              // Fresh tomato
              <svg viewBox="0 0 512 512" className="w-5 h-5 sm:w-6 sm:h-6 text-[#fa320a]" fill="currentColor">
                <path d="M256,48C141.1,48,48,141.1,48,256s93.1,208,208,208s208-93.1,208-208S370.9,48,256,48z"/>
                <path fill="#22c55e" d="M256,48c-10,30-40,60-70,60c-20,0-30-20-30-20s10,40,40,60c20,13.3,40,10,60,10c20,0,40,3.3,60-10c30-20,40-60,40-60s-10,20-30,20C296,108,266,78,256,48z"/>
              </svg>
            ) : (
              // Rotten splat
              <svg viewBox="0 0 512 512" className="w-6 h-6 sm:w-7 sm:h-7 text-[#57bd24]" fill="currentColor">
                <path d="M375.4,196.2c-3.1-9.9-6.9-19-11.4-27.4c-4.5-8.4-9.6-15.6-15.3-21.7c-5.7-6-11.8-11.1-18.4-15c-6.6-4-13.6-6.6-21-7.8 c-7.4-1.2-15-1.2-22.9,0c-7.9,1.2-15.8,3.9-23.7,7.8c-7.9,4-15.6,9.1-23.1,15c-7.5,6-14.7,13.2-21.4,21.7c-6.7,8.4-12.7,17.5-17.9,27.4 c-5.2,9.9-9.5,20.5-12.8,31.7c-3.3,11.2-5.4,22.8-6.4,34.8c-1,12,0.1,23.6,3.3,34.8c3.3,11.2,8.5,21.3,15.6,30.3 c7.1,9,15.8,16.5,26.2,22.4c10.4,6,22.1,9.9,35.1,11.8c13,1.9,27,1.9,41.9,0c14.9-1.9,30.3-5.8,46.2-11.8c15.9-6,31.7-13.9,47.4-23.7 l-18.4-44.4c-11.2,7.4-22,13.2-32.4,17.5c-10.4,4.2-20,6.9-28.7,8.1c-8.7,1.2-16.3,1-22.9-0.6c-6.6-1.6-12.1-4.7-16.5-9.4 c-4.4-4.7-7.8-10.8-10-18.1c-2.2-7.4-3.3-15.8-3.3-25.3h148.6C381.1,236.4,379.7,216.5,375.4,196.2z"/>
              </svg>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-bold text-base sm:text-xl leading-none">{rtRating.replace('%', '')}%</span>
          </div>
        </div>
      )}

      {/* Metacritic */}
      {mcRating && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-[46px] sm:h-[46px] bg-[#0a0a0a] rounded-xl sm:rounded-[14px] flex items-center justify-center border border-zinc-800 shadow-sm shrink-0">
            <div className="bg-[#FFCC33] w-5 h-5 sm:w-6 sm:h-6 rounded-sm sm:rounded-[4px] flex items-center justify-center">
              <span className="text-black font-black text-[11px] sm:text-[14px] leading-none">M</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-bold text-base sm:text-xl leading-none">{mcRating.split('/')[0]}</span>
          </div>
        </div>
      )}

    </div>
  );
};
