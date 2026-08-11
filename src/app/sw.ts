/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate, CacheableResponsePlugin, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: /^https?:\/\/.*\/api\/.*/i,
      handler: new NetworkFirst({
        cacheName: "backend-user-data",
      }),
    },
    {
      matcher: /^https?:\/\/.*\/auth\/.*/i,
      handler: new NetworkFirst({
        cacheName: "backend-auth",
      }),
    },
    {
      matcher: /^https?:\/\/.*\/tmdb\/.*/i,
      handler: new NetworkFirst({
        cacheName: "backend-tmdb-proxy",
      }),
    },
    {
      matcher: /^https?:\/\/.*\/tracking\/.*/i,
      handler: new NetworkFirst({
        cacheName: "backend-tracking",
      }),
    },
    {
      matcher: /^https:\/\/image\.tmdb\.org\/.*/i,
      handler: new CacheFirst({
        cacheName: "tmdb-images",
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 500,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          }),
        ],
      }),
    },
    {
      matcher: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "cloudinary-images",
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          }),
        ],
      }),
    },
    {
      matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
      }),
    },
    {
      matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "google-fonts-webfonts",
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
