import { site } from "@/content/site";

/**
 * The canonical origin for this deployment.
 *
 * Three sources, in order:
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — set this in Vercel once the custom domain is
 *    live, and on any environment that should own its own canonical URL.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — injected by Vercel. Lets preview and
 *    production builds resolve their own absolute URLs before a custom domain
 *    exists, instead of silently pointing at a domain that does not resolve.
 * 3. `site.url` — the intended final address, used for local builds.
 *
 * Without this, Next resolves Open Graph images against `http://localhost:3000`
 * and warns at build time. A shared link would then show a broken preview
 * everywhere, which is the sort of thing nobody notices until someone posts it.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  return stripTrailingSlash(site.url);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
