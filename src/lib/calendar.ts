import type { LabEvent } from "@/types";

import { site } from "@/content/site";

/**
 * Google Calendar's "add event" template URL.
 *
 * A plain link — no API, no OAuth, no key. Google reads the whole event out of
 * the query string, so this works for a signed-out visitor and costs us nothing
 * to maintain. It is deliberately not the Calendar *embed*, which was cut: an
 * embed shows the lab's calendar, whereas people asking to "add to calendar"
 * want the event in *theirs*.
 *
 * `dates` must be UTC basic format — `YYYYMMDDTHHMMSSZ` — with no separators.
 */
export function googleCalendarUrl(event: LabEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.title} — ${site.name}`,
    dates: `${toBasicUtc(event.startsAt)}/${toBasicUtc(event.endsAt)}`,
    details: `${event.shortDescription}\n\n${site.url}/workshops/${event.slug}`,
    location: `${event.location}, ${site.university}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** ISO 8601 → the basic UTC form Google expects: 2026-08-14T09:30:00Z → 20260814T093000Z */
function toBasicUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
