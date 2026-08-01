import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { MobileNav } from "@/components/layout/MobileNav";
import { footerLinks, navLinks, site } from "@/content/site";

/**
 * Server component. The only client-side part is <MobileNav />, which owns the
 * drawer's open state.
 */
export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-h3 text-primary">
          {site.name}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              /* Lime fails contrast as an underline on white, so light
                 surfaces get accent-dark. See globals.css. */
              className="hover-underline text-small font-medium text-ink transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Phase 4 swaps this for the auth button / user menu. */}
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>

          <MobileNav
            links={navLinks}
            secondaryLinks={footerLinks}
            siteName={site.name}
          />
        </div>
      </Container>
    </header>
  );
}
