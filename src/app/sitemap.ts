import type { MetadataRoute } from "next";

const BASE_URL = "https://tvtrac.fun/";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
    },
  ];
}