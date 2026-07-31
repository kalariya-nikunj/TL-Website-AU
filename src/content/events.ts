import type { LabEvent } from "@/types";

/**
 * PLACEHOLDER DATA — replace in Phase 5.
 *
 * Phase 4 decides whether events stay content-as-code or come from Google Calendar.
 * Either way, consumers should only use the helpers below so the swap is a one-file change.
 */
export const events: LabEvent[] = [
  {
    slug: "laser-cutter-induction",
    title: "Laser Cutter Induction",
    startsAt: "2026-08-14T10:00:00+05:30",
    endsAt: "2026-08-14T12:30:00+05:30",
    location: "Fabrication Bay, Tinkerer Lab",
    shortDescription:
      "The mandatory induction that unlocks independent laser cutter access.",
    description:
      "Placeholder description. Covers material rules, file preparation, focus and power settings, extraction, and the fire response procedure. You leave with a signed induction card.",
    capacity: 12,
    registrationOpen: true,
    image: "/images/events/laser-cutter-induction.jpg",
  },
  {
    slug: "intro-to-3d-printing",
    title: "Intro to 3D Printing",
    startsAt: "2026-08-22T14:00:00+05:30",
    endsAt: "2026-08-22T17:00:00+05:30",
    location: "3D Printing Bay, Tinkerer Lab",
    shortDescription:
      "From a CAD file to a printed part in one afternoon. No experience needed.",
    description:
      "Placeholder description. Design constraints for FDM, slicing, supports and orientation, and what to do when a print fails. Bring a laptop.",
    capacity: 20,
    registrationOpen: true,
    image: "/images/events/intro-to-3d-printing.jpg",
  },
  {
    slug: "pcb-design-sprint",
    title: "PCB Design Sprint",
    startsAt: "2026-09-05T09:30:00+05:30",
    endsAt: "2026-09-06T17:00:00+05:30",
    location: "Electronics Bench, Tinkerer Lab",
    shortDescription:
      "A two-day sprint: schematic to fabrication-ready Gerbers.",
    description:
      "Placeholder description. Schematic capture, footprint selection, layout and routing, design rule checks, and submitting a board for fabrication.",
    capacity: 16,
    registrationOpen: true,
    image: "/images/events/pcb-design-sprint.jpg",
  },
  {
    slug: "makers-open-day",
    title: "Makers' Open Day",
    startsAt: "2026-09-19T11:00:00+05:30",
    endsAt: "2026-09-19T18:00:00+05:30",
    location: "Tinkerer Lab, School of Engineering and Applied Science",
    shortDescription:
      "The whole lab is open. Demos on every machine, projects on every bench.",
    description:
      "Placeholder description. Drop in at any point. Open to students, faculty, family, and prospective applicants.",
    registrationOpen: false,
    image: "/images/events/makers-open-day.jpg",
  },
  {
    slug: "cnc-safety-workshop",
    title: "CNC Safety & Workholding",
    startsAt: "2026-10-03T10:00:00+05:30",
    endsAt: "2026-10-03T13:00:00+05:30",
    location: "Fabrication Bay, Tinkerer Lab",
    shortDescription:
      "Required before you can book router time. Hands-on, small group.",
    description:
      "Placeholder description. Workholding strategies, feeds and speeds, tool changes, and the emergency stop drill.",
    capacity: 10,
    registrationOpen: true,
    image: "/images/events/cnc-safety-workshop.jpg",
  },
];

const byStartDate = (a: LabEvent, b: LabEvent) =>
  a.startsAt.localeCompare(b.startsAt);

export function getEvent(slug: string): LabEvent | undefined {
  return events.find((event) => event.slug === slug);
}

/** All events, soonest first. */
export function getAllEvents(): LabEvent[] {
  return [...events].sort(byStartDate);
}

/** Events that have not finished yet, soonest first. */
export function getUpcomingEvents(limit?: number): LabEvent[] {
  const now = Date.now();
  const upcoming = getAllEvents().filter(
    (event) => new Date(event.endsAt).getTime() >= now,
  );
  return typeof limit === "number" ? upcoming.slice(0, limit) : upcoming;
}

/** Events that have already finished, most recent first. */
export function getPastEvents(): LabEvent[] {
  const now = Date.now();
  return getAllEvents()
    .filter((event) => new Date(event.endsAt).getTime() < now)
    .reverse();
}

export const eventSlugs = events.map((event) => event.slug);
