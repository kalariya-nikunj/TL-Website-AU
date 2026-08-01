"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Container } from "@/components/layout/Container";
import { headerConfig, headerNav, headerWordmark, site } from "@/content/site";
import { cn } from "@/lib/utils";
import type { TextToken } from "@/types";

/**
 * Token lookups. Tailwind only sees class names that appear literally in the
 * source, so the config's token names are resolved through these maps rather
 * than interpolated into a string.
 */
const TEXT: Record<TextToken, string> = {
  ink: "text-ink",
  primary: "text-primary",
  "primary-dark": "text-primary-dark",
  background: "text-background",
  surface: "text-surface",
  muted: "text-muted",
  accent: "text-accent",
  "accent-dark": "text-accent-dark",
};

const UNDERLINE: Record<TextToken, string> = {
  ink: "after:bg-ink",
  primary: "after:bg-primary",
  "primary-dark": "after:bg-primary-dark",
  background: "after:bg-background",
  surface: "after:bg-surface",
  muted: "after:bg-muted",
  accent: "after:bg-accent",
  "accent-dark": "after:bg-accent-dark",
};

/**
 * A 2px rule that wipes in from the left. Driven by transform rather than
 * width so it stays on the compositor, and shared by every nav item.
 */
const UNDERLINE_BASE =
  "relative after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-250 after:ease-out hover:after:scale-x-100 focus-visible:after:scale-x-100 data-[open=true]:after:scale-x-100";

/** How long the panel survives a mouseleave, so diagonal travel doesn't close it. */
const CLOSE_DELAY_MS = 150;

type HeaderProps = {
  /**
   * "over-hero" starts transparent so a full-bleed hero shows through; "solid"
   * is opaque from the first paint. Defaults by route — only the home page has
   * a hero to sit over.
   */
  variant?: "over-hero" | "solid";
};

export function Header({ variant }: HeaderProps) {
  const pathname = usePathname();
  const mode = variant ?? (pathname === "/" ? "over-hero" : "solid");

  const [scrolled, setScrolled] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [submenuOffset, setSubmenuOffset] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panelId = useId();

  const panelOpen = openIndex !== null;
  const compact = scrolled;
  /* Transparent only at the very top, and never while the panel is open —
     the submenu has to stay readable over whatever is behind it. */
  const transparent = mode === "over-hero" && !scrolled && !panelOpen;

  /* ---- Scroll state -----------------------------------------------------
     A 1px sentinel parked 60px down the document. Watching it with an
     IntersectionObserver keeps this off the scroll event loop entirely. */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ---- Panel open/close -------------------------------------------------- */
  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  /* Swapping between two parents just moves the index — the panel never
     closes and reopens, so there is no flicker. */
  const openPanel = useCallback(
    (index: number) => {
      cancelClose();
      setOpenIndex(index);
    },
    [cancelClose],
  );

  const closePanel = useCallback(() => {
    cancelClose();
    setOpenIndex(null);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenIndex(null), CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  /* ---- Submenu alignment -------------------------------------------------
     The submenu starts at the hovered parent's left edge, so the offset is a
     measurement rather than a token. */
  useEffect(() => {
    if (openIndex === null) return;

    const measure = () => {
      const row = rowRef.current;
      const item = itemRefs.current[openIndex];
      if (!row || !item) return;
      setSubmenuOffset(
        item.getBoundingClientRect().left - row.getBoundingClientRect().left,
      );
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [openIndex]);

  /* ---- Escape closes and hands focus back to the parent ------------------ */
  useEffect(() => {
    if (openIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const returnTo = itemRefs.current[openIndex];
      closePanel();
      returnTo?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openIndex, closePanel]);

  const navColor = transparent
    ? TEXT[headerConfig.topNavColor]
    : TEXT[headerConfig.navColor];
  const wordmarkColor = transparent
    ? TEXT[headerConfig.topNavColor]
    : TEXT[headerConfig.logoTextColor];
  const underlineColor = UNDERLINE[headerConfig.accentColor];

  const surface = transparent
    ? "bg-transparent"
    : panelOpen
      ? "border-b border-border bg-surface"
      : scrolled
        ? "border-b border-border bg-surface/95 backdrop-blur-sm"
        : "border-b border-border bg-surface";

  const activeItem = openIndex === null ? null : headerNav[openIndex];

  return (
    <>
      {/* Zero-height anchor so the sentinel sits 60px down the document. */}
      <div className="relative h-0">
        <div
          ref={sentinelRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-15 h-px w-full"
        />
      </div>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-300 ease-out",
          surface,
        )}
        onMouseLeave={scheduleClose}
      >
        <Container>
          {/* Height is fixed across both states so the nav never shifts
              vertically — only the logo resizes. */}
          <div
            ref={rowRef}
            className="flex h-20 items-center justify-between gap-4"
          >
            <Link
              href="/"
              className="flex items-center"
              onFocus={scheduleClose}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid shrink-0 place-items-center rounded-lg font-display transition-all duration-300 ease-out",
                  transparent
                    ? "bg-accent text-primary-dark"
                    : "bg-primary text-surface",
                  compact
                    ? "size-10 text-body"
                    : "size-10 text-body lg:size-16 lg:text-h3",
                )}
              >
                TL
              </span>

              {/* Collapses to zero width rather than just hiding, so the row
                  closes up instead of leaving a gap. */}
              <span
                className="hidden overflow-hidden transition-[grid-template-columns] duration-300 ease-out lg:grid"
                style={{ gridTemplateColumns: compact ? "0fr" : "1fr" }}
              >
                <span
                  className={cn(
                    "min-w-0 overflow-hidden ps-3 whitespace-nowrap transition-opacity duration-300 ease-out",
                    wordmarkColor,
                    compact ? "opacity-0" : "opacity-100",
                  )}
                >
                  {headerWordmark.map((line) => (
                    <span key={line} className="block text-wordmark">
                      {line}
                    </span>
                  ))}
                </span>
              </span>

              <span className="sr-only">{site.name} — home</span>
            </Link>

            <div className="hidden items-center gap-7 lg:flex">
              <nav aria-label="Main">
                <ul className="flex items-center gap-7">
                  {headerNav.map((item, index) => {
                    const isOpen = openIndex === index;

                    /* No children means no panel — a plain link that only
                       carries the underline. */
                    if (!item.children) {
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onMouseEnter={scheduleClose}
                            onFocus={scheduleClose}
                            className={cn(
                              "text-small font-medium transition-colors",
                              navColor,
                              UNDERLINE_BASE,
                              underlineColor,
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    }

                    return (
                      <li key={item.href}>
                        <button
                          ref={(el) => {
                            itemRefs.current[index] = el;
                          }}
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          data-open={isOpen}
                          onMouseEnter={() => openPanel(index)}
                          onFocus={() => openPanel(index)}
                          onClick={() =>
                            isOpen ? closePanel() : openPanel(index)
                          }
                          className={cn(
                            "cursor-pointer text-small font-medium transition-colors",
                            navColor,
                            UNDERLINE_BASE,
                            underlineColor,
                          )}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <Button
                asChild
                size="sm"
                variant={transparent ? "accent" : "default"}
              >
                <Link href="/login" onFocus={scheduleClose}>
                  Sign in
                </Link>
              </Button>
            </div>

            <MobileMenu open={mobileOpen} onOpenChange={setMobileOpen} tone={navColor} />
          </div>
        </Container>

        {/* One continuous surface with the bar above it — the header grows
            rather than dropping a detached card. */}
        <div
          id={panelId}
          role="region"
          aria-label={activeItem ? `${activeItem.label} menu` : "Submenu"}
          inert={!panelOpen}
          className="hidden transition-[grid-template-rows] duration-250 ease-out lg:grid"
          style={{ gridTemplateRows: panelOpen ? "1fr" : "0fr" }}
          onMouseEnter={cancelClose}
        >
          <div className="overflow-hidden">
            <Container>
              <ul
                style={{ marginInlineStart: submenuOffset }}
                className={cn(
                  "flex flex-col pb-6 transition-opacity duration-200 ease-out",
                  panelOpen ? "opacity-100 delay-100" : "opacity-0",
                )}
              >
                {activeItem?.children?.map((child) => (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={closePanel}
                      className={cn(
                        "flex h-11 w-fit items-center text-body transition-colors hover:text-primary",
                        TEXT[headerConfig.navColor],
                        UNDERLINE_BASE,
                        underlineColor,
                      )}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </div>
        </div>
      </header>

      {/* Fixed headers leave no space behind them; solid pages get it back. */}
      {mode === "solid" && <div aria-hidden="true" className="h-20" />}
    </>
  );
}

/**
 * Touch has no hover, so below `lg` the same tree becomes a drawer with the
 * submenus as an accordion. Radix locks body scroll while it is open.
 */
function MobileMenu({
  open,
  onOpenChange,
  tone,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  tone: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("lg:hidden", tone)}>
          <MenuIcon aria-hidden="true" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-display text-h3 text-primary">
            {site.name}
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4">
          <Accordion type="single" collapsible>
            {headerNav.map((item) =>
              item.children ? (
                <AccordionItem key={item.href} value={item.href}>
                  <AccordionTrigger>{item.label}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => onOpenChange(false)}
                            className="flex h-11 items-center text-body text-muted transition-colors hover:text-primary"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex h-12 items-center border-b border-border font-display text-base font-semibold text-ink transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ),
            )}
          </Accordion>
        </nav>

        <div className="border-t border-border p-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/login" onClick={() => onOpenChange(false)}>
              Sign in
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
