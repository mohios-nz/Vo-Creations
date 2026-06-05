import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://vocreations.com";

  return [
    {
      url: base,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/about`,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/mentorship`,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/creators`,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/roi`,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/blog/text-on-screen-ugc`,
      lastModified: new Date("2026-03-24"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
