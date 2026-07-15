"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { logoutUser } from "@/store/slices/authSlice";
import { useRouter, usePathname } from "next/navigation";

export function BottomNav() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading || !user) {
    return null;
  }

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/");
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-black/90 backdrop-blur-2xl border-t border-zinc-800 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-between px-6 py-4">
        
        <button 
          onClick={() => router.push("/shows")}
          className={`cursor-pointer flex flex-col items-center gap-1 transition-colors group ${pathname.startsWith("/shows") ? "text-white" : "text-zinc-500 hover:text-white"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide">Shows</span>
        </button>
        
        <button 
          onClick={() => router.push("/movies")}
          className={`cursor-pointer flex flex-col items-center gap-1 transition-colors group ${pathname.startsWith("/movies") ? "text-white" : "text-zinc-500 hover:text-white"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide">Movies</span>
        </button>

        <button 
          onClick={() => router.push("/discover")}
          className={`cursor-pointer flex flex-col items-center gap-1 transition-colors group ${pathname === "/discover" ? "text-white" : "text-zinc-500 hover:text-white"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide">Discover</span>
        </button>

        <button 
          onClick={() => router.push("/lists")}
          className={`cursor-pointer flex flex-col items-center gap-1 transition-colors group ${pathname.startsWith("/lists") ? "text-white" : "text-zinc-500 hover:text-white"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide">My List</span>
        </button>

        <button 
          onClick={() => router.push("/profile")}
          className={`cursor-pointer flex flex-col items-center gap-1 transition-colors group ${pathname === "/profile" ? "text-white" : "text-zinc-500 hover:text-white"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide">Profile</span>
        </button>

      </div>
    </div>
  );
}
