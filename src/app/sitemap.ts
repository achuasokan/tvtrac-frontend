import type { MetadataRoute } from "next";

const BASE_URL = "https://tvtrac-frontend.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}