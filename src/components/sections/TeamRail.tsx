"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PauseIcon, PlayIcon } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { TeamCard } from "@/components/cards/TeamCard";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/types";

/**
 * Two rows of team cards drifting in opposite directions.
 *
 * The loop is pure CSS: each row holds its members twice and slides exactly
 * -50%, which lands on a frame identical to the start, so the reset is
 * invisible. JavaScript never touches the transform — it only decides which
 * card is centred and whether the rows are playing.
 *
 * Under reduced motion none of that exists. The rail becomes a two-row grid the
 * user scrolls themselves.
 */

/**
 * Leaves a 6% band across the middle of the viewport. Wider than the gap
 * between cards, so a card is essentially always emphasised; the cost is that
 * during a handoff both neighbours are briefly inside it, which reads as a
 * crossfade rather than a fault.
 */
const CENTRE_BAND = "0px -47% 0px -47%";

type TeamRailProps = {
  members: TeamMember[];
  id: string;
  title: string;
  description?: string;
  /** Optional "see everyone" link, beside the pause toggle. */
  action?: { label: string; href: string };
};

export function TeamRail({
  members,
  id,
  title,
  description,
  action,
}: TeamRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(motion.matches);

    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  /* ---- Centre card ------------------------------------------------------- */
  useEffect(() => {
    if (reduced) return;

    const rail = railRef.current;
    if (!rail) return;

    const cards = Array.from(
      rail.querySelectorAll<HTMLElement>(".team-track > li"),
    );

    /* Root is the viewport, not the rail: "nearest the centre" means the centre
       of the screen, and both rows share that line. */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting) card.setAttribute("data-active", "true");
          else card.removeAttribute("data-active");
        }
      },
      { rootMargin: CENTRE_BAND, threshold: 0 },
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
      cards.forEach((card) => card.removeAttribute("data-active"));
    };
  }, [reduced]);

  /* Split, rather than interleave, so each row reads as a group. */
  const half = Math.ceil(members.length / 2);
  const rows = [members.slice(0, half), members.slice(half)];

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

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            {/* Nothing moves under reduced motion, so nothing to pause. */}
            {!reduced && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setPlaying((on) => !on)}
                aria-pressed={!playing}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
                {playing ? "Pause" : "Play"}
              </Button>
            )}

            {action && (
              <Button asChild size="lg">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </Container>

      {reduced ? (
        /* Two rows, scrolled by hand. Same cards, no motion of any kind. */
        <div
          tabIndex={0}
          role="region"
          aria-label={`${title} — scroll to see everyone`}
          className="card-rail mt-8 overflow-x-auto overscroll-x-contain py-4"
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
          className="team-rail mt-8 flex flex-col gap-6"
        >
          {rows.map((row, index) => (
            <div key={index} className="team-row">
              <ul
                style={{ "--team-count": row.length } as React.CSSProperties}
                className={`team-track ${index === 1 ? "team-track-reverse" : ""}`}
              >
                {row.map((member) => (
                  <li key={member.id}>
                    <TeamCard member={member} />
                  </li>
                ))}

                {/*
                  The second set exists only so the -50% reset has somewhere to
                  land. `aria-hidden` keeps it out of the reading order and
                  `inert` keeps its social links out of the tab order — without
                  the second, a keyboard user would tab through every member
                  twice and hit links marked hidden.
                */}
                {row.map((member) => (
                  <li key={`${member.id}-loop`} aria-hidden="true" inert>
                    <TeamCard member={member} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
