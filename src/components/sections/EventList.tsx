"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClockIcon, MapPinIcon } from "lucide-react";

import { FilterChip } from "@/components/ui/filter-chip";
import { formatDateBlock, formatMonthGroup, formatTime } from "@/lib/format";
import type { LabEvent } from "@/types";

/**
 * The events list.
 *
 * Deliberately not a card grid. Everything useful about an event is short —
 * date, time, place, whether you can still book — so a row shows roughly eight
 * events in the space three cards would take, and the date column gives the eye
 * a single edge to scan down.
 *
 * Only the filter is client-side. The list itself is rendered from an array the
 * server already resolved; nothing is fetched here.
 */

type Filter = "upcoming" | "past" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

const EMPTY: Record<Filter, string> = {
  upcoming:
    "Nothing scheduled right now. New workshops go up at the start of term.",
  past: "No past events yet.",
  all: "No events yet.",
};

type EventListProps = {
  /** Every event, soonest first. */
  events: LabEvent[];
  /**
   * The server's clock, as an ISO string. Passed in rather than read from
   * `Date.now()` so the client's first render matches the server's markup —
   * deciding "past" locally would hydrate differently every time.
   */
  nowIso: string;
  /** Where the empty states point. */
  calendarHref?: string;
};

export function EventList({
  events,
  nowIso,
  calendarHref = "#calendar",
}: EventListProps) {
  const [filter, setFilter] = useState<Filter>("upcoming");

  const now = useMemo(() => new Date(nowIso).getTime(), [nowIso]);

  const visible = useMemo(() => {
    if (filter === "all") return events;
    const past = (event: LabEvent) => new Date(event.endsAt).getTime() < now;
    return events.filter((event) =>
      filter === "past" ? past(event) : !past(event),
    );
  }, [events, filter, now]);

  /* Grouped in render order, so the sticky heading always matches the rows
     underneath it. */
  const groups = useMemo(() => {
    const byMonth = new Map<string, LabEvent[]>();
    for (const event of visible) {
      const key = formatMonthGroup(event.startsAt);
      const bucket = byMonth.get(key);
      if (bucket) bucket.push(event);
      else byMonth.set(key, [event]);
    }
    return [...byMonth];
  }, [visible]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <FilterChip
            key={option.id}
            pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>

      {/* Filtering is silent otherwise — the list just changes under you. */}
      <p aria-live="polite" className="mt-4 text-small text-muted">
        {visible.length === 1
          ? "1 event"
          : `${visible.length} events`}
      </p>

      {groups.length === 0 ? (
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-body text-muted">{EMPTY[filter]}</p>
          <Link
            href={calendarHref}
            className="hover-underline mt-2 inline-block text-small font-medium text-primary"
          >
            See the lab calendar
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          {groups.map(([month, monthEvents]) => (
            <section key={month} aria-label={month}>
              {/*
                `top-20` clears the fixed 80px header. The background is not
                decoration — rows scroll underneath this.
              */}
              <h3 className="eyebrow sticky top-20 z-10 border-b border-border bg-background py-3">
                {month}
              </h3>

              <ul>
                {monthEvents.map((event) => (
                  <EventRow
                    key={event.slug}
                    event={event}
                    past={new Date(event.endsAt).getTime() < now}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({ event, past }: { event: LabEvent; past: boolean }) {
  const date = formatDateBlock(event.startsAt);

  return (
    <li className={past ? "opacity-70" : undefined}>
      <Link
        href={`/workshops/${event.slug}`}
        className="group relative flex min-h-24 items-center gap-5 border-b border-border py-4 pl-5 transition-colors hover:bg-primary-tint"
      >
        {/* Wipes down the left edge on hover. Under reduced motion the global
            rule collapses the duration, so it simply appears. */}
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-250 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
        />

        {/* The scan anchor. Fixed width so every row's title starts at the
            same x. */}
        <span
          className={`flex w-14 shrink-0 flex-col items-center ${past ? "text-muted" : "text-primary"}`}
        >
          <span className="text-eyebrow font-display font-semibold uppercase">
            {date.month}
          </span>
          <span className="font-display text-h3 leading-none">{date.day}</span>
          <span className="mt-0.5 text-small text-muted">
            {date.weekday.slice(0, 3)}
          </span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-6">
          <span className="min-w-0">
            <span className="block font-display text-card-title text-ink transition-colors group-hover:text-primary">
              {event.title}
            </span>

            <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="size-3.5 shrink-0" aria-hidden="true" />
                {formatTime(event.startsAt)}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </span>
            </span>
          </span>

          {/* Words carry the state; the dot only reinforces it. */}
          <span className="flex shrink-0 flex-col gap-0.5 text-small md:items-end">
            {event.registrationOpen && !past ? (
              <span className="inline-flex items-center gap-1.5 text-accent-dark">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-accent"
                />
                Open
              </span>
            ) : (
              <span className="text-muted">Closed</span>
            )}

            {typeof event.capacity === "number" && (
              <span className="text-muted">{event.capacity} places</span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}
