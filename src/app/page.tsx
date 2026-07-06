import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export const dynamic = 'force-dynamic';

// Fetch live poster data from TVMaze API
async function getPosters() {
  try {
    // TVMaze API is completely open, public, and requires no API key
    const res = await fetch("https://api.tvmaze.com/shows", {
      // The API response is cached for 24 hours to prevent rate-limiting
      next: { revalidate: 86400 }
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch posters");
    }

    const shows = await res.json();
    
    // Extract all valid high-quality original poster images
    const allPosters = shows
      .map((show: any) => show.image?.original || show.image?.medium)
      .filter(Boolean);

    // Shuffle the array randomly and return 30 completely unique posters on every visit!
    const shuffledPosters = allPosters.sort(() => 0.5 - Math.random());
    return shuffledPosters.slice(0, 30);
  } catch (error) {
    console.error("Error fetching TVMaze posters:", error);
    return [];
  }
}

export default async function Home() {
  // Wait for the posters to load on the server
  const posterGrid = await getPosters();

  return (
    <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0A0A]">
      
      {/* Real Movie Poster Grid Background & Overlay */}
      {/* Both share this container so hovered items can pop above the overlay! */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        
        {/* The Grid */}
        <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 w-[110%] h-[110%] -translate-x-5 -translate-y-5 scale-105">
          {posterGrid.map((posterUrl: string, i: number) => (
            <div 
              key={i} 
              // Base z-0, on hover z-50 to pop above the z-10 overlay!
              className="group relative z-0 w-full aspect-[2/3] rounded-lg bg-slate-900/50 overflow-hidden shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:z-50 cursor-default"
            >
              <img
                src={posterUrl}
                alt="Show Poster"
                className="object-cover w-full h-full opacity-40 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
              {/* Optional subtle border glow on hover */}
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/30 rounded-lg transition-colors duration-500" />
            </div>
          ))}
        </div>

        {/* Cinematic Dark Overlay - placed INSIDE the grid container at z-10 */}
        {/* Unhovered items are z-0 (behind), hovered items are z-50 (above!) */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-black/40" />
      </div>

      {/* Clean Full-Bleed Content Container (No Box) */}
      {/* Added pointer-events-none so hover passes through empty space, but pointer-events-auto on the interactive elements */}
      <div className="pointer-events-none w-full max-w-2xl mx-auto text-center z-10 flex flex-col items-center px-4">
        
        {/* Clean Logo */}
        <div className="mb-6 animate-fade-in-up">
          <span className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
            tvtrac.
          </span>
        </div>
        
        {/* Sleek Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 font-medium mb-12 max-w-md mx-auto tracking-wide drop-shadow-lg leading-relaxed">
          Your universe of shows and movies, perfectly organized.
        </p>

        {/* Call to Action Container */}
        <div className="pointer-events-auto w-full flex justify-center">
          <GoogleLoginButton />
        </div>
      </div>
    </main>
  );
}
