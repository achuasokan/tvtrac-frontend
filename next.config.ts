import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable in development so hot-reload is not affected
  disable: process.env.NODE_ENV === "development",
  // Register the Service Worker automatically
  register: true,
  // Use the generated service worker from workbox
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    // Don't precache images (too large) — let runtime caching handle them
    exclude: [/\.map$/, /^manifest.*\.js$/, /\/_next\/image\?url/],
    runtimeCaching: [
      // ─────────────────────────────────────────────────────────────
      // Your Backend — User Data (auth, collection, watchlist, etc.)
      // Strategy: NetworkFirst (24hr cache) — fresh data preferred,
      // but falls back to cached copy when offline
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "backend-user-data",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ─────────────────────────────────────────────────────────────
      // Your Backend — Auth endpoints (/auth/me, /auth/google, etc.)
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https?:\/\/.*\/auth\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "backend-auth",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ─────────────────────────────────────────────────────────────
      // Your Backend — TMDB Proxy (/tmdb/trending, /tmdb/title, etc.)
      // Strategy: NetworkFirst (1hr cache) — content updates daily
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https?:\/\/.*\/tmdb\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "backend-tmdb-proxy",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ─────────────────────────────────────────────────────────────
      // Your Backend — Tracking endpoints (/tracking/...)
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https?:\/\/.*\/tracking\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "backend-tracking",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ─────────────────────────────────────────────────────────────
      // TMDB Image CDN (posters, backdrops, profile images)
      // Strategy: CacheFirst (30 days) — images are stable, huge
      // performance win for repeat views
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "tmdb-images",
          expiration: {
            maxEntries: 512,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ─────────────────────────────────────────────────────────────
      // Cloudinary (user avatars / profile pictures)
      // Strategy: CacheFirst (30 days) — avatars almost never change
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cloudinary-images",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // ─────────────────────────────────────────────────────────────
      // Google Fonts CSS
      // Strategy: StaleWhileRevalidate — serve cached instantly,
      // update in background
      // ─────────────────────────────────────────────────────────────
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-stylesheets",
          expiration: {
            maxEntries: 8,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      // Google Fonts files (woff2, etc.)
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default withPWA(nextConfig);
