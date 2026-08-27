import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

/**
 * `/login` and `/my-registrations` are disallowed because neither has anything
 * for a crawler: one is a sign-in dead end, the other renders only a prompt
 * without a session. Keeping them out avoids thin pages in the index.
 *
 * This is not a security boundary — robots.txt is a request, not a control.
 * The actual protection is that registrations are only ever fetched through a
 * Server Action that verifies an ID token.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/my-registrations"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
