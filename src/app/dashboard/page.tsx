"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

// Mock Data for New Card Design
const watchlist: any[] = [];

export default function Dashboard() {
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"watchlist" | "upcoming">("watchlist");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="h-8 w-8 rounded-full border-4 border-zinc-800 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative min-h-screen bg-[#050505] text-white pb-24 font-sans">
      
      {/* Top Tabs (Ultra Minimalist) */}
      <div className="w-full flex items-center justify-center gap-8 pt-8 pb-4 sticky top-0 z-40 bg-gradient-to-b from-[#050505] to-transparent backdrop-blur-md">
        <button 
          onClick={() => setActiveTab("watchlist")}
          className={`text-sm font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === "watchlist" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-400"}`}
        >
          Watch List
          {activeTab === "watchlist" && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-2 shadow-[0_0_10px_white]" />}
        </button>
        <button 
          onClick={() => setActiveTab("upcoming")}
          className={`text-sm font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === "upcoming" ? "text-white scale-110" : "text-zinc-600 hover:text-zinc-400"}`}
        >
          Upcoming
          {activeTab === "upcoming" && <div className="w-1.5 h-1.5 rounded-full bg-white mx-auto mt-2 shadow-[0_0_10px_white]" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        
        {activeTab === "watchlist" ? (
          <div className="flex flex-col gap-8">
            
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black tracking-tight text-white">Up Next for You</h2>
            </div>

            {/* Premium Empty State (Compact) */}
            {watchlist.length === 0 ? (
              <div className="relative w-full rounded-2xl overflow-hidden mt-2 group shadow-xl">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-[#0a0a0a] to-zinc-900 group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-[80px]" />
                
                {/* Glassmorphism Content */}
                <div className="relative z-10 w-full h-full p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-black/20 backdrop-blur-xl border border-white/5">
                  
                  {/* Floating Icon */}
                  <div className="relative w-14 h-14 mb-5">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-b from-zinc-800 to-black rounded-full border border-zinc-700/50 flex items-center justify-center shadow-2xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-3 tracking-tight">
                    Bring your watch history
                  </h3>
                  
                  <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed font-medium">
                    You aren't tracking any shows yet. Skip the manual work and instantly import your entire history from TV Time.
                  </p>
                  
                  <button className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:scale-105 hover:bg-zinc-200 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Import TV Time Data
                  </button>

                  <button className="text-zinc-500 hover:text-white font-medium transition-colors text-xs flex items-center gap-1 group/link">
                    Or add shows manually 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {watchlist.map((item) => (
                  <div key={item.id} className="relative w-full h-36 sm:h-48 rounded-2xl overflow-hidden group cursor-pointer shadow-xl">
                    {/* Background Image */}
                    <img src={item.img} alt={item.show} className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                    
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent opacity-80" />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
                      
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col max-w-[75%]">
                          {/* Show Title */}
                          <span className="text-zinc-400 font-bold text-[9px] sm:text-[10px] tracking-[0.2em] uppercase mb-1">
                            {item.show}
                          </span>
                          
                          {/* Episode Title */}
                          <h3 className="text-lg sm:text-2xl font-extrabold text-white mb-2 leading-tight truncate">
                            {item.title}
                          </h3>
                          
                          {/* Meta Data */}
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
                            <span className="bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                              {item.s}
                            </span>
                            <span className="bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
                              {item.e}
                            </span>
                            <span className="text-zinc-400 text-[10px] sm:text-xs tracking-wider uppercase">• {item.remaining}</span>
                          </div>
                        </div>

                        {/* Play/Check Button (Smaller) */}
                        <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        ) : (
          /* Upcoming Tab Content */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight mb-2">No Upcoming Shows</span>
            <span className="text-zinc-500 max-w-xs leading-relaxed">When shows on your watchlist announce new episodes, they will appear here.</span>
          </div>
        )}
      </div>

    </main>
  );
}
