import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/discover",
        "/discover/movies",
        "/discover/tv",
        "/movies",
        "/shows",
        "/profile",
        "/dashboard",
        "/lists",
      ],
    },
    sitemap: "https://tvtrac.fun/sitemap.xml",
  };
}