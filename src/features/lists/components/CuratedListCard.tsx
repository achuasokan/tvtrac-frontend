import { useEffect, useState } from "react";
import Link from "next/link";
import { CuratedListDef } from "../data/curatedLists";
import { api } from "@/lib/api";

interface CuratedListCardProps {
  curatedList: CuratedListDef;
}

// Module-level cover cache to prevent refetching on navigation
const curatedCoverCache = new Map<string, string[]>();

export function CuratedListCard({ curatedList }: CuratedListCardProps) {
  const [posters, setPosters] = useState<string[]>(() => curatedCoverCache.get(curatedList.id) || []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !curatedCoverCache.has(curatedList.id));

  useEffect(() => {
    let isMounted = true;

    if (curatedCoverCache.has(curatedList.id)) {
      setPosters(curatedCoverCache.get(curatedList.id)!);
      setIsLoading(false);
      return;
    }

    const fetchCoverItems = async () => {
      try {
        const queryParams = new URLSearchParams({
          type: curatedList.fetchParams.type,
          page: "1",
          ...curatedList.fetchParams.params,
        }).toString();

        const res = await api.get(`/tmdb/discover/advanced?${queryParams}`);
        const results = res.data?.results || [];

        const coverPosters = results.slice(0, 4).map((item: any) => {
          if (item.backdrop_path) {
            return `https://image.tmdb.org/t/p/w500${item.backdrop_path}`;
          } else if (item.poster_path) {
            return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
          }
          return null;
        }).filter(Boolean) as string[];

        curatedCoverCache.set(curatedList.id, coverPosters);

        if (isMounted) {
          setPosters(coverPosters);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCoverItems();
    return () => {
      isMounted = false;
    };
  }, [curatedList]);

  return (
    <div className="group relative isolate w-full aspect-video rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-xl hover:shadow-[0_8px_30px_rgba(254,215,184,0.15)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">
      
      {/* Sci-Fi Fading Border Glow - Always Visible & Fills Corners */}
      <div 
        className="absolute inset-0 z-40 pointer-events-none rounded-2xl border-[1.5px] border-transparent opacity-90 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(217,138,89,0.3)] transition-all duration-300"
        style={{
          background: 'linear-gradient(to top, rgba(217, 138, 89, 0.95) 0%, rgba(217, 138, 89, 0.4) 40%, transparent 75%) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          maskComposite: 'exclude',
          transform: 'translateZ(0)'
        }}
      />

      {/* Background Image / Loading State */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        {isLoading ? (
          <div className="w-full h-full bg-zinc-900 animate-pulse flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-700 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : posters.length > 0 ? (
          <div className="flex w-full h-full">
            {posters.map((poster, idx) => (
              <div key={idx} className="flex-1 h-full relative overflow-hidden border-r border-black/40 last:border-r-0">
                <img 
                  src={poster} 
                  alt="Poster" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out animate-in fade-in duration-300"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${curatedList.bannerGradient}`} />
        )}

        {/* Smooth Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <Link href={`/lists/${curatedList.id}`} className="absolute inset-0 z-10" aria-label={`View ${curatedList.name}`} />

      {/* Top Left Tag */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-zinc-200 text-[11px] font-semibold tracking-wide group-hover:border-[rgba(254,215,184,0.4)] transition-colors duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#fed7b8] group-hover:animate-pulse shadow-[0_0_8px_rgba(254,215,184,0.8)]"></span>
          {curatedList.tag}
        </span>
      </div>

      {/* Card Content Overlay */}
      <div className="absolute bottom-3.5 left-4 right-4 z-20 pointer-events-none">
        <h3 className="text-white font-extrabold text-xl sm:text-2xl truncate tracking-tight drop-shadow-md group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#fed7b8] transition-all duration-300">
          {curatedList.name}
        </h3>
        <p className="text-zinc-400 text-xs font-medium mt-0.5 tracking-wide group-hover:text-zinc-300 transition-colors">
          {curatedList.totalCount} titles
        </p>
      </div>
    </div>
  );
}
