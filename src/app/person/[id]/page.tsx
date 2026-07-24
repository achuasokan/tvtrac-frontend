"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function PersonDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [person, setPerson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [creditFilter, setCreditFilter] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/tmdb/person/${id}`);
        setPerson(res.data);
      } catch (error) {
        console.error("Failed to fetch person details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPerson();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505]">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <p>Person not found.</p>
      </div>
    );
  }

  // Sort and filter credits
  const castCredits = person.combined_credits?.cast || [];
  const crewCredits = person.combined_credits?.crew || [];
  
  // Deduplicate combined credits by ID so we don't show the same movie twice if they directed AND produced it
  const allCreditsMap = new Map();
  [...castCredits, ...crewCredits].forEach((credit: any) => {
    if (!allCreditsMap.has(credit.id)) {
      allCreditsMap.set(credit.id, credit);
    }
  });
  let credits = Array.from(allCreditsMap.values());
  
  // Filter out talk shows, news, and appearances as "Self"
  credits = credits.filter((credit: any) => {
    const isTalkOrNews = credit.genre_ids && (credit.genre_ids.includes(10767) || credit.genre_ids.includes(10763));
    const isSelf = credit.character && (
      credit.character.toLowerCase().includes("self") || 
      credit.character.toLowerCase().includes("himself") || 
      credit.character.toLowerCase().includes("herself") ||
      credit.character.toLowerCase().includes("guest")
    );
    return !isTalkOrNews && !isSelf;
  });

  const filteredCredits = credits.filter((credit: any) => creditFilter === 'all' || credit.media_type === creditFilter);
  const sortedCredits = [...filteredCredits].sort((a, b) => b.popularity - a.popularity).slice(0, 50);

  return (
    <main className="flex-1 flex flex-col relative min-h-screen bg-[#050505] text-white pb-24 font-sans">
      
      {/* Sticky App Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex items-center justify-between h-16 px-4 sm:px-6 ${isScrolled ? 'bg-[#050505]/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-transparent pt-4'}`}>
        <button onClick={() => router.back()} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isScrolled ? 'hover:bg-white/10' : 'bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className={`flex-1 text-center font-bold text-lg px-4 truncate transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
          {person.name}
        </h1>
        
        <div className="w-10 h-10 flex items-center justify-center" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-32 w-full flex flex-col md:flex-row gap-8 md:gap-12">
        
        {/* Left Column: Photo & Personal Info */}
        <div className="w-full md:w-1/3 flex flex-col items-center md:items-start shrink-0">
          <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mb-6 bg-zinc-900 border border-zinc-800">
            {person.profile_path ? (
              <img 
                src={`https://image.tmdb.org/t/p/w500${person.profile_path}`} 
                alt={person.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="w-full mt-6 md:mt-0">
            <h2 className="text-xl font-bold mb-4 text-center md:text-left">Personal Info</h2>
            <div className="flex flex-wrap md:flex-col gap-4 md:gap-0 justify-center md:justify-start text-center md:text-left">
              {person.known_for_department && (
                <div className="mb-0 md:mb-4 w-[45%] md:w-full">
                  <h3 className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-wider">Known For</h3>
                  <p className="text-zinc-200 text-sm sm:text-base">{person.known_for_department}</p>
                </div>
              )}
              {person.birthday && (
                <div className="mb-0 md:mb-4 w-[45%] md:w-full">
                  <h3 className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-wider">Birthday</h3>
                  <p className="text-zinc-200 text-sm sm:text-base">{person.birthday}</p>
                </div>
              )}
              {person.place_of_birth && (
                <div className="mb-0 md:mb-4 w-full">
                  <h3 className="text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-wider">Place of Birth</h3>
                  <p className="text-zinc-200 text-sm sm:text-base">{person.place_of_birth}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Bio & Credits */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-center md:text-left">{person.name}</h1>
          
          {person.biography && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">Biography</h2>
              <div className="text-zinc-300 leading-relaxed space-y-4 text-sm sm:text-base whitespace-pre-wrap">
                {person.biography}
              </div>
            </div>
          )}

          {credits.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-center sm:text-left">Known For</h2>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 w-full sm:w-max">
                  <button 
                    onClick={() => setCreditFilter('all')}
                    className={`cursor-pointer flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${creditFilter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setCreditFilter('movie')}
                    className={`cursor-pointer flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${creditFilter === 'movie' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Movies
                  </button>
                  <button 
                    onClick={() => setCreditFilter('tv')}
                    className={`cursor-pointer flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${creditFilter === 'tv' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                  >
                    TV Shows
                  </button>
                </div>
              </div>
              
              {sortedCredits.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {sortedCredits.map((credit: any, index: number) => (
                    <Link 
                      key={`${credit.id}-${index}`} 
                      href={`/title/${credit.media_type}/${credit.id}`}
                      className="group flex flex-col cursor-pointer"
                    >
                      <div className="w-full aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-3 transition-transform group-hover:scale-105 group-hover:border-zinc-500 shadow-md">
                        {credit.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w300${credit.poster_path}`} 
                            alt={credit.title || credit.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <span className="text-xs text-center px-2">{credit.title || credit.name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-white transition-colors">{credit.title || credit.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{credit.character ? `as ${credit.character}` : ''}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 italic">No {creditFilter === 'movie' ? 'movies' : 'TV shows'} found for this person.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
