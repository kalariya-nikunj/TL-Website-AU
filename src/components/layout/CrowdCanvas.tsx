"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Ambient walking crowd for the foot of the footer.
 *
 * A port of the Open Peeps walking-cycle effect onto a short band rather than a
 * full screen. The sheet is self-hosted; nothing here reaches out to a CDN.
 *
 * This mounts on every page, so the lifecycle matters more than the effect:
 * the ticker only runs while the band is actually on screen, everything is torn
 * down on unmount, and a reduced-motion preference collapses it to one static
 * frame that never animates.
 */

/** Where the sheet lives. See the note in Footer.tsx for the expected format. */
const SHEET_SRC = "/images/peeps.avif";

/**
 * Sprite sheet grid. The sheet is sliced into `SHEET_COLUMNS * SHEET_ROWS`
 * equal cells, left to right then top to bottom. If a replacement sheet has a
 * different layout, these two numbers are the only thing to correct.
 */
const SHEET_COLUMNS = 15;
const SHEET_ROWS = 7;

/** Roughly one figure per this many pixels of width, clamped either side. */
const PX_PER_PEEP = 110;
const MIN_CROWD = 4;
const MAX_CROWD = 24;

/** Seconds for a figure to cross the full width, before per-peep timescale. */
const CROSS_DURATION = 10;
/** Seconds per bob. */
const BOB_DURATION = 0.25;

const RESIZE_DEBOUNCE_MS = 150;

type Rect = [x: number, y: number, width: number, height: number];

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function removeRandom<T>(items: T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items.splice(index, 1)[0];
}

class Peep {
  readonly image: HTMLImageElement;
  readonly rect: Rect;
  /** Rendered size, after the band's fit scale. */
  width = 0;
  height = 0;
  x = 0;
  y = 0;
  /** Sort key: figures lower in the band draw in front. */
  anchorY = 0;
  /** -1 flips the sprite to walk the other way. */
  facing: 1 | -1 = 1;
  scale = 1;
  walk: gsap.core.Timeline | null = null;

  constructor(image: HTMLImageElement, rect: Rect) {
    this.image = image;
    this.rect = rect;
  }

  setScale(scale: number) {
    this.scale = scale;
    this.width = this.rect[2] * scale;
    this.height = this.rect[3] * scale;
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing * this.scale, this.scale);
    ctx.drawImage(
      this.image,
      this.rect[0],
      this.rect[1],
      this.rect[2],
      this.rect[3],
      0,
      0,
      this.rect[2],
      this.rect[3],
    );
    ctx.restore();
  }
}

export function CrowdCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** The sheet is decorative — if it will not load, the band leaves entirely. */
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const stage = { width: 0, height: 0 };
    const allPeeps: Peep[] = [];
    const available: Peep[] = [];
    const crowd: Peep[] = [];

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let observer: IntersectionObserver | null = null;
    let running = false;
    let disposed = false;

    const image = new Image();

    /* ---- Crowd construction ------------------------------------------- */

    function buildPeeps() {
      const cellWidth = image.naturalWidth / SHEET_COLUMNS;
      const cellHeight = image.naturalHeight / SHEET_ROWS;

      for (let i = 0; i < SHEET_COLUMNS * SHEET_ROWS; i++) {
        const column = i % SHEET_COLUMNS;
        const row = Math.floor(i / SHEET_COLUMNS);
        allPeeps.push(
          new Peep(image, [
            column * cellWidth,
            row * cellHeight,
            cellWidth,
            cellHeight,
          ]),
        );
      }
    }

    /**
     * Places a peep just off one edge and returns where it should walk to.
     * Figures sit a little below the band's floor so feet crop naturally.
     */
    function placePeep(peep: Peep) {
      // Fit to the band, then vary slightly so the crowd has depth.
      const cellHeight = peep.rect[3];
      const fit = (stage.height / cellHeight) * randomRange(0.92, 1.08);
      peep.setScale(fit);

      const walkingRight = Math.random() > 0.5;
      peep.facing = walkingRight ? 1 : -1;

      const depth = gsap.parseEase("power2.in")(Math.random());
      const startY = stage.height - peep.height + stage.height * 0.12 * depth;

      const startX = walkingRight ? -peep.width : stage.width + peep.width;
      const endX = walkingRight ? stage.width + peep.width : -peep.width;

      peep.x = startX;
      peep.y = startY;
      peep.anchorY = startY;

      return { startY, endX };
    }

    function walkPeep(peep: Peep) {
      const { startY, endX } = placePeep(peep);

      const timeline = gsap.timeline({
        onComplete: () => {
          if (disposed) return;
          // Recycle: back into the pool, and pull a fresh one in behind it.
          crowd.splice(crowd.indexOf(peep), 1);
          available.push(peep);
          addToCrowd();
        },
      });

      timeline.timeScale(randomRange(0.5, 1.5));
      timeline.to(peep, { duration: CROSS_DURATION, x: endX, ease: "none" }, 0);
      timeline.to(
        peep,
        {
          duration: BOB_DURATION,
          repeat: Math.round(CROSS_DURATION / BOB_DURATION),
          yoyo: true,
          y: startY - stage.height * 0.04,
          ease: "power1.inOut",
        },
        0,
      );

      // Timelines autoplay on creation. Everything starts paused and only the
      // observer decides to run it, otherwise the crowd walks while offscreen.
      if (!running || reduceMotion) timeline.pause();

      peep.walk = timeline;
      return peep;
    }

    function addToCrowd() {
      if (!available.length) return null;
      const peep = walkPeep(removeRandom(available));
      crowd.push(peep);
      // Lower anchor draws later, so nearer figures overlap further ones.
      crowd.sort((a, b) => a.anchorY - b.anchorY);
      return peep;
    }

    function clearCrowd() {
      for (const peep of crowd) peep.walk?.kill();
      crowd.length = 0;
      available.length = 0;
      available.push(...allPeeps);
    }

    /* ---- Rendering ------------------------------------------------------ */

    function render() {
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      ctx.scale(dpr, dpr);
      for (const peep of crowd) peep.render(ctx);
    }

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      stage.width = canvas.clientWidth;
      stage.height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(stage.width * dpr));
      canvas.height = Math.max(1, Math.floor(stage.height * dpr));

      clearCrowd();

      const target = Math.round(stage.width / PX_PER_PEEP);
      const count = Math.min(
        Math.max(target, MIN_CROWD),
        MAX_CROWD,
        allPeeps.length,
      );

      for (let i = 0; i < count; i++) {
        const peep = addToCrowd();
        // Stagger them across the band instead of all entering at once.
        peep?.walk?.progress(Math.random());
      }

      // Always paint one frame so the band is never blank, whether or not the
      // ticker is going to run.
      render();

      // A resize mid-run rebuilds the crowd, so hand the new timelines back.
      if (running && !reduceMotion) {
        for (const peep of crowd) peep.walk?.play();
      }
    }

    /* ---- Ticker, gated by visibility ------------------------------------ */

    function start() {
      if (running || reduceMotion || disposed) return;
      running = true;
      gsap.ticker.add(render);
      for (const peep of crowd) peep.walk?.play();
    }

    function stop() {
      if (!running) return;
      running = false;
      gsap.ticker.remove(render);
      for (const peep of crowd) peep.walk?.pause();
    }

    /** Debounced — the raw event rebuilds the entire crowd on every tick. */
    function onResize() {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        if (!disposed) resize();
      }, RESIZE_DEBOUNCE_MS);
    }

    function init() {
      if (disposed) return;
      buildPeeps();
      resize();

      window.addEventListener("resize", onResize);

      // Nothing runs while the footer is scrolled out of view.
      observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0 },
      );
      observer.observe(canvas!);
    }

    image.onload = init;
    image.onerror = () => {
      if (!disposed) setFailed(true);
    };
    image.src = SHEET_SRC;

    /* ---- Teardown: this footer is on every page ------------------------- */
    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      gsap.ticker.remove(render);
      for (const peep of crowd) peep.walk?.kill();
      crowd.length = 0;
      available.length = 0;
      allPeeps.length = 0;
    };
  }, []);

  if (failed) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative h-30 w-full overflow-hidden md:h-45"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-40 invert"
      />
      {/* Figures emerge out of the footer rather than sitting in a hard strip. */}
      <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-primary-dark to-transparent" />
    </div>
  );
}
