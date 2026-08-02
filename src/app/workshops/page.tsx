import type { Metadata } from "next";

import { CTASection } from "@/components/sections/CTASection";
import { EventList } from "@/components/sections/EventList";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getAllEvents } from "@/content/events";

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
          title="Lab calendar"
          description="The Google Calendar embed lands in Phase 4 — it becomes the source of truth for dates."
          className="mb-8"
        />
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border bg-surface text-small text-muted">
          Calendar embed — Phase 4
        </div>
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
