import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import DomeGallery from "@/components/ui/DomeGallery";
import { FALLBACK_POSTERS } from "@/lib/constants/posters";
import { siteConfig } from "@/lib/constants/site";

export const dynamic = 'force-dynamic';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Fetch trending posters exclusively through TVTrac Express Backend (MongoDB Cached + SWR)
async function getPosters() {
  try {
    const baseUrl = BACKEND_API_URL.endsWith('/api') ? BACKEND_API_URL : `${BACKEND_API_URL}/api`;
    
    // Fetch Movies (Page 1 & 2) and TV Shows (Page 1 & 2) in parallel from backend MongoDB cache
    const [movies1Res, movies2Res, tv1Res, tv2Res] = await Promise.all([
      fetch(`${baseUrl}/tmdb/trending/movie?page=1`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/tmdb/trending/movie?page=2`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/tmdb/trending/tv?page=1`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/tmdb/trending/tv?page=2`, { next: { revalidate: 3600 } }),
    ]);

    const results = await Promise.all([
      movies1Res.ok ? movies1Res.json() : null,
      movies2Res.ok ? movies2Res.json() : null,
      tv1Res.ok ? tv1Res.json() : null,
      tv2Res.ok ? tv2Res.json() : null,
    ]);

    const allRawItems = results.flatMap((r) => r?.results || r?.items || []);

    const posterUrls = allRawItems
      .map((item: any) => {
        if (item.posterUrl) return item.posterUrl;
        if (item.poster_path) return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        return null;
      })
      .filter((url: string | null): url is string => url !== null && url.trim() !== "");

    // Deduplicate unique poster URLs
    const uniquePosters = Array.from(new Set(posterUrls));

    // Shuffle array for maximum visual randomness
    for (let i = uniquePosters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePosters[i], uniquePosters[j]] = [uniquePosters[j], uniquePosters[i]];
    }

    if (uniquePosters.length > 0) {
      return uniquePosters;
    }
    
    return FALLBACK_POSTERS;
  } catch (error) {
    console.warn("Backend poster fetch unavailable, using fallback posters:", error);
    return FALLBACK_POSTERS;
  }
}

export default async function Home() {
  const posterGrid = await getPosters();

  return (
    <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#0A0A0A]">
      {/* Real Movie Poster Grid Background & Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden scale-105 md:scale-110">
        <DomeGallery 
          images={posterGrid.map((url: string) => ({ src: url, alt: "Show Poster" }))}
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
        {/* Cinematic Dark Overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
      </div>

      {/* Soft Radial Text Backdrop */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.4)_0%,transparent_75%)]" />

      {/* Clean Full-Bleed Content Container */}
      <div className="pointer-events-none w-full max-w-2xl mx-auto text-center z-20 flex flex-col items-center px-4">
        <div className="mb-6 animate-fade-in-up">
          <span className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,1)' }}>
            {siteConfig.name}
          </span>
        </div>
        
        <p className="text-xl md:text-2xl text-slate-200 font-medium mb-12 max-w-md mx-auto tracking-wide leading-relaxed" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,1)' }}>
          {siteConfig.tagline}
        </p>

        <div className="pointer-events-auto w-full flex justify-center">
          <GoogleLoginButton />
        </div>
      </div>
    </main>
  );
}
