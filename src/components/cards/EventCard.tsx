import { ClockIcon, MapPinIcon } from "lucide-react";

import { CardBase } from "@/components/cards/CardBase";
import { formatCardDate, formatTime } from "@/lib/format";
import type { LabEvent } from "@/types";

type EventCardProps = {
  event: LabEvent;
  priority?: boolean;
};

/** Events without artwork fall back to the lab's own photo. */
const FALLBACK_IMAGE = "/images/hero/workshops-a.jpg";

export function EventCard({ event, priority }: EventCardProps) {
  return (
    <li>
      <CardBase
        href={`/workshops/${event.slug}`}
        image={event.image ?? FALLBACK_IMAGE}
        imageAlt={`${event.title} at the Tinkerer Lab`}
        badge={formatCardDate(event.startsAt)}
        title={event.title}
        priority={priority}
        meta={
          <span className="inline-flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" />
            {event.location}
          </span>
        }
        specs={
          <>
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="size-3.5" aria-hidden="true" />
              {formatTime(event.startsAt)}
            </span>

            {/*
              The dot is decorative — the words carry the state, so the status
              never depends on seeing a colour.
            */}
            {event.registrationOpen ? (
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-accent"
                />
                Registration open
              </span>
            ) : (
              <span className="text-background/60">Registration closed</span>
            )}
          </>
        }
      />
    </li>
  );
}
