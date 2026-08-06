import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import DomeGallery from "@/components/ui/DomeGallery";

export const dynamic = 'force-dynamic';

// Fetch highly optimized trending posters from TMDB (Movies and Shows)
async function getPosters() {
  try {
    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    
    if (!TMDB_API_KEY) {
      console.warn("Missing TMDB_API_KEY in environment variables");
      return [];
    }
    
    // Fetch both trending movies and TV shows
    const [moviesRes, showsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`, {
        next: { revalidate: 86400 } // Cache for 24 hours
      }),
      fetch(`https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_API_KEY}`, {
        next: { revalidate: 86400 }
      })
    ]);
    
    if (!moviesRes.ok || !showsRes.ok) {
      throw new Error("Failed to fetch TMDB posters");
    }

    const movies = await moviesRes.json();
    const shows = await showsRes.json();
    
    // Combine, extract optimized 'w500' URLs, and filter out missing ones
    const allPosters = [...(movies.results || []), ...(shows.results || [])]
      .map((item: any) => item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null)
      .filter((url): url is string => url !== null);

    // Randomize the array perfectly
    for (let i = allPosters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPosters[i], allPosters[j]] = [allPosters[j], allPosters[i]];
    }

    // Take exactly what we need for the globe
    return allPosters.slice(0, 35);
  } catch (error) {
    console.error("Error fetching TMDB posters:", error);
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
      <div className="absolute inset-0 z-0 overflow-hidden scale-105 md:scale-110">
        <DomeGallery 
          images={posterGrid.map((url: string) => ({ src: url, alt: "TV Show Poster" }))}
          autoRotateSpeed={0.08}
          grayscale={false}
          overlayBlurColor="#0A0A0A"
          minRadius={300}
          fit={1.3}
          fitBasis="max"
          openedImageWidth="100vw"
          openedImageHeight="100vh"
          openedImageBorderRadius="0px"
          segments={45}
        />
        {/* Cinematic Dark Overlay - placed INSIDE the grid container at z-10 */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-black/40" />
      </div>

      {/* Soft Radial Text Backdrop for Readability over any poster */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.6)_0%,transparent_60%)]" />

      {/* Clean Full-Bleed Content Container (No Box) */}
      <div className="pointer-events-none w-full max-w-2xl mx-auto text-center z-20 flex flex-col items-center px-4">
        
        {/* Clean Logo */}
        <div className="mb-6 animate-fade-in-up">
          <span className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,1)' }}>
            tvtrac.
          </span>
        </div>
        
        {/* Sleek Subtitle */}
        <p className="text-xl md:text-2xl text-slate-200 font-medium mb-12 max-w-md mx-auto tracking-wide leading-relaxed" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,1)' }}>
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
