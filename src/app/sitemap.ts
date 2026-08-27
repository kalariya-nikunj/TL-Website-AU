import type { MetadataRoute } from "next";

import { eventSlugs } from "@/content/events";
import { facilitySlugs } from "@/content/facilities";
import { projectSlugs } from "@/content/projects";
import { siteUrl } from "@/lib/site-url";

/**
 * Generated from the content files, so a new workshop or project appears in the
 * sitemap by existing rather than by somebody remembering to add it here.
 *
 * `/login` and `/my-registrations` are deliberately absent: one is a dead end
 * for a search engine, the other is per-user and renders nothing without a
 * session. They are excluded in `robots.ts` too.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/workshops", priority: 0.9 },
    { path: "/facilities", priority: 0.9 },
    { path: "/portfolio", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/help", priority: 0.6 },
  ];

  const detailRoutes = [
    ...eventSlugs.map((slug) => `/workshops/${slug}`),
    ...facilitySlugs.map((slug) => `/facilities/${slug}`),
    ...projectSlugs.map((slug) => `/portfolio/${slug}`),
  ];

  return [
    ...staticRoutes.map(({ path, priority }) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...detailRoutes.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
