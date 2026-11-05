"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClockIcon, MapPinIcon } from "lucide-react";

import { FilterChip } from "@/components/ui/filter-chip";
import { formatDateBlock, formatTime } from "@/lib/format";
import type { LabEvent } from "@/types";

type PosterEvent = {
  slug: string;
  title: string;
  href: string;
  poster: StaticImageData;
  isPast: boolean;
};

type WorkshopEvent = {
  slug: string;
  title: string;
  href: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  registrationOpen?: boolean;
  capacity?: number;
  isPast?: boolean;
  poster?: StaticImageData;
};

type Filter = "upcoming" | "past" | "all";

const filters: { id: Filter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

const emptyMessages: Record<Filter, string> = {
  upcoming:
    "Nothing scheduled right now. New workshops go up at the start of term.",
  past: "No past events yet.",
  all: "No events yet.",
};

export function WorkshopEventList({
  events,
  posterEvents,
  nowIso,
}: {
  events: LabEvent[];
  posterEvents: PosterEvent[];
  nowIso: string;
}) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const now = useMemo(() => new Date(nowIso).getTime(), [nowIso]);
  const items = useMemo<WorkshopEvent[]>(
    () => [
      ...events.map((event) => ({
        ...event,
        href: `/workshops/${event.slug}`,
      })),
      ...posterEvents,
    ],
    [events, posterEvents],
  );
  const visible = items.filter((event) => {
    if (filter === "all" || filter === "past") {
      return Boolean(event.poster && event.isPast);
    }
    const past =
      event.isPast ??
      (event.endsAt ? new Date(event.endsAt).getTime() < now : false);
    return !past;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((option) => (
          <FilterChip
            key={option.id}
            pressed={filter === option.id}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </FilterChip>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-small text-muted">
        {visible.length === 1 ? "1 event" : `${visible.length} events`}
      </p>

      {visible.length === 0 ? (
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-body text-muted">{emptyMessages[filter]}</p>
          <Link
            href="#calendar"
            className="hover-underline mt-2 inline-block text-small font-medium text-primary"
          >
            See the lab calendar
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) =>
            event.poster ? (
              <li key={event.slug}>
                <Link
                  href={event.href}
                  className="group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-muted"
                >
                  <span className="relative block aspect-[4/3] bg-primary-tint">
                    <Image
                      src={event.poster}
                      alt={`${event.title} poster`}
                      fill
                      sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
                      className="object-contain"
                    />
                  </span>
                  <span className="block p-5 font-display text-card-title text-ink transition-colors group-hover:text-primary">
                    {event.title}
                  </span>
                </Link>
              </li>
            ) : (
              <WorkshopEventRow key={event.slug} event={event} now={now} />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function WorkshopEventRow({
  event,
  now,
}: {
  event: WorkshopEvent;
  now: number;
}) {
  const past = event.endsAt
    ? new Date(event.endsAt).getTime() < now
    : false;
  const date = event.startsAt ? formatDateBlock(event.startsAt) : undefined;

  return (
    <li className={past ? "opacity-70" : undefined}>
      <Link
        href={event.href}
        className="group relative flex min-h-24 items-center gap-5 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-primary-tint"
      >
        {date && (
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
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-card-title text-ink transition-colors group-hover:text-primary">
            {event.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted">
            {event.startsAt && (
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="size-3.5 shrink-0" aria-hidden="true" />
                {formatTime(event.startsAt)}
              </span>
            )}
            {event.location && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}
