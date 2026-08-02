"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

/**
 * The homepage's horizontal card rail.
 *
 * A native scroll container with CSS scroll snapping — not a drag carousel.
 * Native scrolling already handles trackpads, touch, shift-wheel, keyboard and
 * momentum, and it needs no JavaScript to work at all. The script here only
 * adds emphasis and arrows on top of something that already functions.
 *
 * The card nearest the left edge is scaled up. Detection is an
 * IntersectionObserver watching a narrow band at the left of the scrollport,
 * so the browser does the geometry off the main thread — no scroll handler
 * measuring cards on every frame.
 */

/**
 * Leaves the leftmost 22% of the scrollport as the detection band. Anything
 * narrower and the gutter alone would fill it; anything wider and two cards sit
 * inside it at once for most of a scroll.
 */
const BAND = "0px -78% 0px 0px";

type CardRailProps = {
  /** Ties the heading to the section's accessible name. */
  id: string;
  title: string;
  description?: string;
  /** The "see everything" link, top right. */
  action: { label: string; href: string };
  /** `<li>` cards. The rail styles and marks them; it does not create them. */
  children: React.ReactNode;
  /** Names the scroll region. Defaults to the section title. */
  ariaLabel?: string;
};

export function CardRail({
  id,
  title,
  description,
  action,
  children,
  ariaLabel,
}: CardRailProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(motion.matches);

    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  /* ---- Active card ------------------------------------------------------- */
  useEffect(() => {
    /* Reduced motion wants no scaling at all, so the cheapest correct thing is
       to never mark a card active — the CSS has nothing to act on. */
    if (reduced) return;

    const scroller = scrollerRef.current;
    const list = listRef.current;
    if (!scroller || !list) return;

    const items = Array.from(list.children) as HTMLElement[];
    const inBand = new Set<number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = items.indexOf(entry.target as HTMLElement);
          if (index < 0) continue;
          if (entry.isIntersecting) inBand.add(index);
          else inBand.delete(index);
        }

        /* Cards enter the band from the right and leave to the left, so the
           highest index inside it is the one arriving at the left edge. Taking
           the lowest would keep the outgoing card emphasised instead. */
        const active = inBand.size > 0 ? Math.max(...inBand) : -1;

        items.forEach((item, index) => {
          if (index === active) item.setAttribute("data-active", "true");
          else item.removeAttribute("data-active");
        });
      },
      { root: scroller, rootMargin: BAND, threshold: 0 },
    );

    items.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      items.forEach((item) => item.removeAttribute("data-active"));
    };
  }, [reduced]);

  /* ---- Arrow state ------------------------------------------------------- */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const max = scroller.scrollWidth - scroller.clientWidth;
      /* A pixel of slack: sub-pixel widths mean scrollLeft rarely hits the
         maximum exactly. */
      setAtStart(scroller.scrollLeft <= 1);
      setAtEnd(scroller.scrollLeft >= max - 1);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current;
      const list = listRef.current;
      const first = list?.firstElementChild as HTMLElement | null;
      if (!scroller || !list || !first) return;

      /* offsetWidth, not the bounding rect: the first card may be scaled up
         as the active one, and a rect would include that. */
      const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
      scroller.scrollBy({
        left: direction * (first.offsetWidth + gap),
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [reduced],
  );

  /* Nothing to scroll to in either direction — the rail fits, so the arrows
     would be decoration. */
  const scrollable = !(atStart && atEnd);

  return (
    <section aria-labelledby={id} className="py-12 md:py-16">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 id={id} className="font-display text-h2 text-primary-dark">
              {title}
            </h2>
            {description && (
              <p className="mt-3 text-body text-muted">{description}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {scrollable && (
              <div className="hidden items-center gap-2 lg:flex">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => step(-1)}
                  disabled={atStart}
                  aria-label="Scroll left"
                >
                  <ArrowLeftIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => step(1)}
                  disabled={atEnd}
                  aria-label="Scroll right"
                >
                  <ArrowRightIcon />
                </Button>
              </div>
            )}

            <Button asChild size="sm">
              <Link href={action.href}>
                {action.label}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      {/*
        Full width, so the rail runs off the right edge of the screen and a
        partial card is always showing — that is the scroll affordance, which is
        why there are no arrows on touch.

        The vertical padding is not decoration: `overflow-x` forces the vertical
        axis to clip too, and the active card scales up out of its own box.
      */}
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel ?? title}
        className="card-rail mt-8 overflow-x-auto overscroll-x-contain py-8"
      >
        <ul ref={listRef} className="card-rail-list flex w-max gap-6">
          {children}
        </ul>
      </div>
    </section>
  );
}
