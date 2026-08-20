"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const BRAND_COLOR = "#2dd4bf";

export default function NotFound() {
  const router = useRouter();

  return (
    <main
      className="flex-1 flex flex-col relative min-h-[80vh] overflow-hidden bg-[#050505]"
      style={{ paddingBottom: "7rem" }}
    >
      {/* ── THEATER FLOOR: Seat rows ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none select-none">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex justify-center gap-[6px] sm:gap-[10px]"
            style={{
              marginBottom: row === 0 ? 0 : -row * 4,
              transform: `perspective(600px) rotateX(${-18 + row * 3}deg) scaleX(${0.7 + row * 0.07})`,
              transformOrigin: "bottom center",
              opacity: 0.28 + row * 0.14,
              paddingLeft: `${row * 12}px`,
              paddingRight: `${row * 12}px`,
            }}
          >
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="rounded-t-md flex-shrink-0"
                style={{
                  width: 28,
                  height: 22,
                  background: `linear-gradient(to bottom, #2a2a2a, #1a1a1a)`,
                  border: "1px solid #383838",
                  boxShadow: "inset 0 2px 0px rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.6)",
                }}
              />
            ))}
          </div>
        ))}
        {/* Floor gradient — thin, not eating seats */}
        <div
          className="h-6 w-full"
          style={{
            background: "linear-gradient(to top, #050505, transparent)",
          }}
        />
      </div>

      {/* ── SPOTLIGHT: cone from top center ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0"
        style={{
          width: 600,
          height: 500,
          background:
            "conic-gradient(from 268deg at 50% 0%, transparent 0%, rgba(45,212,191,0.045) 1.5%, rgba(45,212,191,0.07) 3%, rgba(45,212,191,0.045) 4.5%, transparent 6%)",
          filter: "blur(1px)",
        }}
      />

      {/* ── SCREEN: the silver cinema screen ── */}
      <div className="relative z-20 w-full flex flex-col items-center pt-10 sm:pt-14 px-6">
        {/* Screen frame */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.88 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px] sm:max-w-[480px] relative"
          style={{
            perspective: 800,
          }}
        >
          {/* Screen outer bezel */}
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
              border: "3px solid #1c1c1c",
              boxShadow: `0 0 0 1px #111, 0 40px 100px -20px rgba(0,0,0,0.9), 0 0 80px rgba(45,212,191,0.06)`,
              background: "#0d0d0d",
              aspectRatio: "16/9",
            }}
          >
            {/* Screen surface — subtle film grain */}
            <div
              className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #0f0f0f 0%, #080808 100%)",
              }}
            >
              {/* Very subtle scan lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 4px)",
                }}
              />

              {/* Spotlight pool on screen */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 70% 80% at 50% -10%, rgba(45,212,191,0.05) 0%, transparent 70%)",
                }}
              />

              {/* ── Main screen content ── */}
              <div className="relative z-10 flex flex-col items-center gap-3 px-8 text-center">
                {/* 404 */}
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="font-black tracking-tighter leading-none select-none"
                  style={{
                    fontSize: "clamp(60px, 14vw, 96px)",
                    color: "rgba(255,255,255,0.06)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  404
                </motion.span>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                  className="flex items-center gap-2"
                >
                  {/* Teal line */}
                  <div
                    className="h-[1px] w-8 sm:w-12 flex-shrink-0"
                    style={{ background: BRAND_COLOR }}
                  />
                  <span
                    className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase whitespace-nowrap"
                    style={{ color: BRAND_COLOR }}
                  >
                    page not found
                  </span>
                  <div
                    className="h-[1px] w-8 sm:w-12 flex-shrink-0"
                    style={{ background: BRAND_COLOR }}
                  />
                </motion.div>
              </div>

              {/* Vignette on screen */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ boxShadow: "inset 0 0 50px rgba(0,0,0,0.7)" }}
              />
            </div>
          </div>

          {/* Screen stand / mount */}
          <div
            className="mx-auto mt-0"
            style={{
              width: "30%",
              height: 8,
              background: "linear-gradient(to bottom, #1c1c1c, #111)",
              borderRadius: "0 0 8px 8px",
            }}
          />
        </motion.div>

        {/* ── Text below screen ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 sm:mt-10 text-center"
        >
          <h1 className="text-[22px] sm:text-2xl font-bold text-white tracking-tight mb-2">
            Nothing's playing here
          </h1>
          <p className="text-sm text-zinc-500 max-w-[260px] mx-auto leading-relaxed">
            This screen went dark. Head back and find your next watch.
          </p>
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center gap-3 w-full max-w-[260px]"
        >
          <Link
            href="/discover"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.97] hover:brightness-110"
            style={{
              background: BRAND_COLOR,
              color: "#050505",
              boxShadow: `0 8px 24px rgba(45,212,191,0.25)`,
            }}
          >
            Discover Shows &amp; Movies
          </Link>

          <button
            onClick={() => router.back()}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors tracking-wide"
          >
            ← or go back
          </button>
        </motion.div>
      </div>
    </main>
  );
}
