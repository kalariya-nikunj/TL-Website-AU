import type { Metadata } from "next";

import { EventCard } from "@/components/cards/EventCard";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getPastEvents, getUpcomingEvents } from "@/content/events";

export const metadata: Metadata = {
  title: "Workshops & events",
  description:
    "Inductions, skill workshops, and open days at the Tinkerer Lab. Free to attend for all students.",
};

/** Upcoming/past split is time-dependent — revalidate hourly. */
export const revalidate = 3600;

export default function WorkshopsPage() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();

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

      <Section ariaLabelledBy="upcoming">
        <SectionHeader id="upcoming" title="Upcoming" />
        {upcoming.length > 0 ? (
          <CardGrid className="mt-8">
            {upcoming.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </CardGrid>
        ) : (
          <p className="mt-6 text-muted">
            Nothing scheduled right now. Check back at the start of term.
          </p>
        )}
      </Section>

      {past.length > 0 && (
        <Section ariaLabelledBy="past">
          <SectionHeader id="past" title="Past events" />
          <CardGrid className="mt-8">
            {past.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </CardGrid>
        </Section>
      )}

      <Section ariaLabelledBy="calendar">
        <SectionHeader
          id="calendar"
          title="Lab calendar"
          description="The Google Calendar embed lands in Phase 4 — it becomes the source of truth for dates."
        />
        <div className="mt-6 flex aspect-video w-full items-center justify-center rounded-lg bg-primary-tint text-sm text-muted">
          Calendar embed — Phase 4
        </div>
      </Section>
    </>
  );
}
