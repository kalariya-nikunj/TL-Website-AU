"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { TeamCard } from "@/components/cards/TeamCard";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/types";

/**
 * Two rows of team cards drifting in opposite directions.
 *
 * The loop is CSS. Each row repeats its member set enough times to overflow the
 * viewport twice, then slides by exactly one set's width — every copy is
 * identical, so the reset lands on the same frame and is invisible.
 * JavaScript measures, marks the centre card, and owns the paused flag; it
 * never touches the transform.
 *
 * Under reduced motion none of that exists. The rail becomes a two-row grid the
 * user scrolls themselves.
 */

/** Resize is noisy; the measurement is not cheap enough to run per event. */
const RESIZE_DEBOUNCE_MS = 150;

/**
 * How often the centre card is recalculated. The scale transition is 350ms, so
 * anything faster than this is work nobody can see.
 */
const PICK_INTERVAL_MS = 100;

type TeamRailProps = {
  members: TeamMember[];
  /** Names the scroll region under reduced motion, where the rows are static. */
  ariaLabel: string;
};

export function TeamRail({ members, ariaLabel }: TeamRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  /** The card each row currently has emphasised, one entry per row. */
  const activeRef = useRef<(HTMLElement | null)[]>([]);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  /* Split, rather than interleave, so each row reads as a group. */
  const half = Math.ceil(members.length / 2);
  const rows = [members.slice(0, half), members.slice(half)];

  /** How many copies of each row's set are on the track. One entry per row. */
  const [repeats, setRepeats] = useState<number[]>(() => rows.map(() => 2));

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(motion.matches);

    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  /* ---- How many copies each row needs ------------------------------------ */
  useEffect(() => {
    if (reduced) return;

    const rail = railRef.current;
    if (!rail) return;

    let timer = 0;

    const measure = () => {
      const rowEls = Array.from(
        rail.querySelectorAll<HTMLElement>("[data-team-row]"),
      );

      const next = rowEls.map((rowEl) => {
        const set = rowEl.querySelector<HTMLElement>(".team-set");
        const setWidth = set?.offsetWidth ?? 0;
        /* Before layout settles there is nothing to divide by. */
        if (!setWidth) return 2;

        /* Twice the viewport: one screen showing, one screen of runway, so the
           track can never run out no matter where the animation is. */
        return Math.max(2, Math.ceil((rowEl.clientWidth * 2) / setWidth));
      });

      setRepeats((previous) =>
        previous.length === next.length &&
        previous.every((value, index) => value === next[index])
          ? previous
          : next,
      );
    };

    measure();

    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  /* ---- Centre card ------------------------------------------------------- */
  useEffect(() => {
    if (reduced || !playing) return;

    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    let lastPick = 0;
    let onScreen = false;
    /* Held across effect runs so pausing does not drop the emphasis: the loop
       stops, the card it picked stays picked. */
    const active = activeRef.current;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastPick < PICK_INTERVAL_MS) return;
      lastPick = now;

      const centre = window.innerWidth / 2;
      const tracks = Array.from(
        rail.querySelectorAll<HTMLElement>(".team-track"),
      );

      /*
        Read every rect first, write every class after. Interleaving them would
        invalidate layout between each read and force a reflow per card.

        Nearest-to-centre rather than an observer band: proximity is what is
        actually wanted, and it yields exactly one winner per row — a band
        reports overlap, so it fires for two cards when both straddle it and for
        none when a gap crosses it.
      */
      const picks = tracks.map((track) => {
        let best: HTMLElement | null = null;
        let bestDistance = Infinity;

        /* `.team-set > li` and not `li`: each card carries its own list of
           social links, and those list items are nearer the centre line more
           often than the cards are. */
        for (const card of track.querySelectorAll<HTMLElement>(
          ".team-set > li",
        )) {
          const rect = card.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - centre);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = card;
          }
        }

        return best;
      });

      picks.forEach((pick, index) => {
        if (pick === active[index]) return;
        active[index]?.removeAttribute("data-active");
        pick?.setAttribute("data-active", "true");
        active[index] = pick;
      });
    };

    /* Nothing to measure while the section is off screen. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === onScreen) return;
        onScreen = entry.isIntersecting;

        if (onScreen) {
          lastPick = 0;
          frame = requestAnimationFrame(tick);
        } else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0 },
    );

    observer.observe(rail);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, playing, repeats]);

  /* Clearing the marks belongs to unmount, not to every pause. */
  useEffect(() => {
    const active = activeRef.current;
    return () => {
      active.forEach((card) => card?.removeAttribute("data-active"));
      active.length = 0;
    };
  }, [reduced]);

  /* Tapping a card is the pause control. The duplicate sets are `inert`, so a
     tap on one of those lands here on the row instead — which is why the
     handler is on the row and not on each card. */
  const toggle = useCallback(() => setPlaying((on) => !on), []);

  return (
    <div>
      {/* Nothing moves under reduced motion, so there is nothing to control. */}
      {!reduced && (
        <Container className="mb-4 flex items-center justify-end gap-3">
          {/* Says out loud what a stopped row otherwise leaves mysterious. */}
          {!playing && (
            <span className="text-small text-muted">Paused — tap to resume</span>
          )}

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={toggle}
            aria-pressed={!playing}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
            {playing ? "Pause" : "Play"}
          </Button>
        </Container>
      )}

      {reduced ? (
        /* Two rows, scrolled by hand. Same cards, no motion of any kind. */
        <div
          tabIndex={0}
          role="region"
          aria-label={ariaLabel}
          className="card-rail overflow-x-auto overscroll-x-contain py-4"
        >
          <ul className="grid w-max auto-cols-[var(--team-card-w-sm)] grid-flow-col grid-rows-2 gap-6 md:auto-cols-[var(--team-card-w)]">
            {members.map((member) => (
              <li key={member.id}>
                <TeamCard member={member} />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div
          ref={railRef}
          data-playing={playing}
          className="team-rail flex flex-col gap-6"
        >
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              data-team-row
              onClick={toggle}
              className="team-row"
            >
              <div
                style={
                  {
                    "--team-count": row.length,
                    "--team-repeat": repeats[rowIndex] ?? 2,
                  } as React.CSSProperties
                }
                className={`team-track ${rowIndex === 1 ? "team-track-reverse" : ""}`}
              >
                {Array.from({ length: repeats[rowIndex] ?? 2 }, (_, copy) => (
                  <ul
                    key={copy}
                    className="team-set"
                    /*
                      Only the first copy is real. The rest are there so the
                      track can outrun the viewport: `aria-hidden` keeps them out
                      of the reading order and `inert` keeps their social links
                      out of the tab order — without the second, a keyboard user
                      would tab through every member N times and land on links
                      marked hidden.
                    */
                    {...(copy > 0 ? { "aria-hidden": true, inert: true } : {})}
                  >
                    {row.map((member) => (
                      <li key={`${member.id}-${copy}`}>
                        <TeamCard member={member} />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
