"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Container } from "@/components/layout/Container";

/**
 * Scroll-driven hero for the homepage.
 *
 * A tall outer container with a sticky viewport-height stage inside it. Scroll
 * position through the container becomes a 0→1 value written to `--p` on the
 * stage; every visual change is a calc() off that one variable.
 *
 * The rules that keep it cheap:
 *   - one scroll handler, one rAF, one getBoundingClientRect per frame
 *   - all layout reads happen before the single style write
 *   - only `transform` and `opacity` animate — the video panel is laid out at
 *     its final full-screen size and scaled *down* at progress 0, so nothing
 *     ever reflows
 *   - no animation library
 */

/** Where the assets live. See public/video/README.md for encoding settings. */
const VIDEO_SRC = "/video/hero.mp4";
const POSTER_SRC = "/images/hero-poster.jpg";

/**
 * Mobile bandwidth guard. The poster carries the effect below `md` and the
 * video is never fetched. Flip to `true` once hero.mp4 is confirmed under ~2MB.
 */
const PLAY_VIDEO_ON_MOBILE = true;

/** Matches Tailwind's `md`. */
const DESKTOP_QUERY = "(min-width: 48rem)";

const HEADLINE_LINES = ["Real", "engineering", "happens here"];

const PARAGRAPH =
  "The Tinkerer Lab is Ahmedabad University's open fabrication space — machines, materials, and the training to use them.";

/*
 * Timings, as fractions of total progress. Kept here so the sequence can be
 * retuned without picking through calc() strings.
 *
 *   0.00  headline full size, video small in the bottom-right corner
 *   0.35  paragraph starts fading in, headline starts shrinking
 *   0.65  video has grown over the headline's lower lines
 *   1.00  video is full-bleed, text gone
 */
const P = "var(--p, 0)";

/** Headline: shrinks from 0.35, fades out over the back half. */
const HEADLINE_STYLE: React.CSSProperties = {
  transformOrigin: "0 0",
  transform: `scale(calc(1 - 0.3 * clamp(0, (${P} - 0.35) / 0.65, 1)))`,
  opacity: `clamp(0, (0.9 - ${P}) / 0.3, 1)`,
};

/** Paragraph: rises and fades in at 0.35, back out before the end. */
const PARAGRAPH_STYLE: React.CSSProperties = {
  transform: `translateY(calc(1.5rem * (1 - clamp(0, (${P} - 0.35) / 0.25, 1))))`,
  opacity: `min(clamp(0, (${P} - 0.35) / 0.25, 1), clamp(0, (1 - ${P}) / 0.15, 1))`,
};

/**
 * Video panel: anchored bottom-right and scaled down at 0, growing to fill.
 * `--vs0` is the starting scale, set per breakpoint on the stage.
 */
const PANEL_STYLE: React.CSSProperties = {
  transformOrigin: "100% 100%",
  transform: `translate(calc(var(--pad) * (${P} - 1)), calc(var(--pad) * (${P} - 1))) scale(calc(var(--vs0) + (1 - var(--vs0)) * ${P}))`,
};

export function VideoHero() {
  const containerRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [reduced, setReduced] = useState(false);
  /** The video only mounts where it is wanted, so mobile never fetches it. */
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia(DESKTOP_QUERY);

    const sync = () => {
      setReduced(motion.matches);
      setShowVideo(
        !motion.matches && (desktop.matches || PLAY_VIDEO_ON_MOBILE),
      );
    };

    sync();
    motion.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
    };
  }, []);

  /* React does not reflect `muted` as a property, and autoplay depends on it. */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, [showVideo]);

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let hinted = false;

    const setHint = (on: boolean) => {
      if (on === hinted) return;
      hinted = on;
      const value = on ? "transform" : "auto";
      if (headlineRef.current) headlineRef.current.style.willChange = value;
      if (panelRef.current) panelRef.current.style.willChange = value;
    };

    const update = () => {
      frame = 0;
      const container = containerRef.current;
      const stage = stageRef.current;
      if (!container || !stage) return;

      // --- read phase: one rect, one viewport height, nothing else ---
      const rect = container.getBoundingClientRect();
      const viewport = window.innerHeight;
      const distance = rect.height - viewport;
      const progress =
        distance <= 0 ? 0 : Math.min(Math.max(-rect.top / distance, 0), 1);

      // --- write phase ---
      stage.style.setProperty("--p", progress.toFixed(4));
      // Drop the compositor hint once the sequence is parked at either end.
      setHint(progress > 0 && progress < 1);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setHint(false);
    };
  }, [reduced]);

  const media = (
    <>
      {/* Poster is the base layer, so first paint never waits on the video.
          It is the page's LCP element, hence `priority`. */}
      <Image
        src={POSTER_SRC}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {showVideo && (
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </>
  );

  /* ---- Reduced motion: no sticky, no listener, no sequence ---------------- */
  if (reduced) {
    return (
      <section className="bg-background pt-28 pb-16 md:pt-36">
        <Container>
          <h1 className="max-w-4xl font-display text-hero text-primary">
            {HEADLINE_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <div className="mt-10 max-w-[34ch]">
            <div aria-hidden="true" className="h-1 w-16 bg-accent" />
            <p className="mt-4 text-body text-muted">{PARAGRAPH}</p>
          </div>

          <div className="relative mt-12 aspect-video w-full overflow-hidden">
            <Image
              src={POSTER_SRC}
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative h-[150dvh] md:h-[200dvh]"
      aria-label="Introduction"
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-[100dvh] overflow-hidden bg-background [--pad:1rem] [--vs0:0.7] md:[--pad:1.5rem] md:[--vs0:0.32]"
        style={{ "--p": 0 } as React.CSSProperties}
      >
        <Container className="relative h-full pt-28">
          {/* Always real text in the DOM — never injected on scroll. */}
          <h1
            ref={headlineRef}
            style={HEADLINE_STYLE}
            className="relative z-10 max-w-4xl font-display text-hero text-primary"
          >
            {HEADLINE_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          {/* Top-right on desktop; there is no room for that on mobile, so it
              sits under the headline instead. */}
          <div
            style={PARAGRAPH_STYLE}
            className="relative z-30 mt-10 max-w-[34ch] md:absolute md:top-28 md:right-6 md:mt-0 lg:right-8"
          >
            <div aria-hidden="true" className="h-1 w-16 bg-accent" />
            <p className="mt-4 text-body text-muted">{PARAGRAPH}</p>
          </div>
        </Container>

        {/* Positioning frame — no transform, so the breakpoint switch costs
            nothing at scroll time.

            At md+ it is the whole viewport, which is landscape, so a 16:9 file
            fills it with only a sliver cropped. A phone viewport is portrait:
            covering it would throw away roughly 70% of a landscape frame's
            width. So below md the frame keeps the footage's own 16:9 and the
            sequence grows it to full width instead of full screen. */}
        <div className="absolute inset-x-0 bottom-[14dvh] z-20 md:inset-0 md:bottom-0">
          {/* Laid out at its final size and scaled down — growing it never
              reflows. Sits above the headline so it covers the lower lines. */}
          <div
            ref={panelRef}
            style={PANEL_STYLE}
            className="relative aspect-video w-full overflow-hidden md:h-full md:aspect-auto"
          >
            {media}
          </div>
        </div>
      </div>
    </section>
  );
}
