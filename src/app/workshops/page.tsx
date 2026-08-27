import type { Metadata } from "next";
import { CalendarPlusIcon } from "lucide-react";

import { CTASection } from "@/components/sections/CTASection";
import { EventList } from "@/components/sections/EventList";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getAllEvents } from "@/content/events";
import { googleCalendarUrl } from "@/lib/calendar";
import { formatEventRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Workshops & events",
  description:
    "Inductions, skill workshops, and open days at the Tinkerer Lab. Free to attend for all students.",
};

/** The upcoming/past split is time-dependent — revalidate hourly. */
export const revalidate = 3600;

export default function WorkshopsPage() {
  const events = getAllEvents();
  /* Resolved once, on the server, and handed to the list. The client must not
     decide what "past" means or its first render would disagree with this
     markup. */
  const nowIso = new Date().toISOString();
  /* The calendar section only ever offers sessions you can still attend —
     adding a finished workshop to your diary is noise. */
  const now = new Date(nowIso).getTime();
  const upcoming = events.filter(
    (event) => new Date(event.endsAt).getTime() >= now,
  );

  return (
    <>
      <PageHero
        eyebrow="Learn a machine"
        title="Workshops & events"
        subtitle="Inductions unlock machine access. Skill workshops teach a technique end to end. Open days need no booking at all."
        imageDefault="/images/hero/workshops-a.jpg"
        imageHover="/images/hero/workshops-b.jpg"
        imageAlt="An induction session running in the Tinkerer Lab"
      />

      <Section tone="default" ariaLabelledBy="events">
        <SectionHeader
          id="events"
          title="What's on"
          description="Every session is free. Inductions are the ones that unlock a machine — the rest are there because someone wanted to teach them."
          className="mb-8"
        />
        <EventList events={events} nowIso={nowIso} />
      </Section>

      <Section tone="tint" id="calendar" ariaLabelledBy="calendar-heading">
        <SectionHeader
          id="calendar-heading"
          title="Add it to your calendar"
          description="Registering does not put a session in your diary. Add the ones you are coming to, so the reminder is where you already look."
          className="mb-8"
        />
        {upcoming.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {upcoming.map((event) => (
              <li key={event.slug}>
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-muted"
                >
                  <span className="font-medium text-ink">{event.title}</span>
                  <span className="flex items-center gap-2 text-small text-muted">
                    {formatEventRange(event.startsAt, event.endsAt)}
                    <CalendarPlusIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="sr-only">Add to Google Calendar</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">
            Nothing scheduled at the moment. New sessions are posted here first.
          </p>
        )}
      </Section>

      <CTASection
        title="Not sure which one to book?"
        description="Start with an induction for the machine your project needs. If you are not sure which that is, ask us."
        primaryAction={{ label: "Get help", href: "/help" }}
        secondaryAction={{ label: "See the facilities", href: "/facilities" }}
      />
    </>
  );
}
