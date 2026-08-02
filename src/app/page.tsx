import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { EventCard } from "@/components/cards/EventCard";
import { FacilityCard } from "@/components/cards/FacilityCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { CTASection } from "@/components/sections/CTASection";
import { CardRail } from "@/components/sections/CardRail";
import { Container } from "@/components/layout/Container";
import { NewsStrip } from "@/components/sections/NewsStrip";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { StatBand } from "@/components/sections/StatBand";
import { TeamRail } from "@/components/sections/TeamRail";
import { VideoHero } from "@/components/sections/VideoHero";
import { facilities } from "@/content/facilities";
import { getUpcomingEvents } from "@/content/events";
import { news } from "@/content/news";
import { featuredProjects } from "@/content/projects";
import { site, stats } from "@/content/site";
import { team } from "@/content/team";

/**
 * The homepage.
 *
 * Every band is a <Section>. No file here sets padding or a background —
 * tone and size are the only spacing decisions, and consecutive sections of
 * the same tone collapse their gap automatically.
 *
 * Tones alternate default/tint for rhythm; the two dark bands (stats, CTA)
 * anchor the top and bottom of the scroll.
 */

/**
 * The upcoming list is filtered against the current time, so the page is
 * revalidated hourly rather than frozen at build time.
 */
export const revalidate = 3600;

export default function HomePage() {
  const upcoming = getUpcomingEvents(4);
  const railFacilities = facilities.slice(0, 5);
  const railProjects = featuredProjects.slice(0, 4);

  return (
    <>
      {/* 1. Hero — scroll-driven video sequence, full bleed, no Section. */}
      <VideoHero />

      {/* 2. News. Dropped entirely when there is nothing to announce. */}
      {news.length > 0 && (
        <Section tone="default" size="compact" ariaLabelledBy="home-news">
          <h2 id="home-news" className="sr-only">
            Announcements
          </h2>
          <NewsStrip items={news} />
        </Section>
      )}

      {/* 3. About preview */}
      <Section tone="default" ariaLabelledBy="home-about">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">{site.university}</p>
            <h2 id="home-about" className="section-title mt-2">
              A workshop that belongs to the students
            </h2>
            <p className="section-lede mt-4 max-w-prose text-body">
              {site.name} is open to every student of {site.university}. Bring an
              idea, learn the machine that makes it, and build it here — no
              experience required, and nothing to pay.
            </p>
            <Link
              href="/about"
              className="hover-underline mt-6 inline-flex items-center gap-1 text-small font-medium text-primary"
            >
              Read more about the lab
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="card-chamfer relative aspect-4/3 w-full overflow-hidden bg-primary-tint">
            <Image
              src="/images/hero/about-a.jpg"
              alt="Students at work in the Tinkerer Lab"
              fill
              sizes="(min-width: 64rem) 45vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      {/* 4. Stats — the first dark anchor. */}
      <StatBand stats={stats} />

      {/* 5. Workshops */}
      <Section tone="default" bleed ariaLabelledBy="home-workshops">
        <Container>
          <SectionHeader
            id="home-workshops"
            title="Next up"
            description="Inductions, workshops, and open days. Most need a free place booked in advance."
            action={{ label: "Discover all", href: "/workshops" }}
            className="mb-8"
          />
        </Container>

        {upcoming.length > 0 ? (
          <CardRail ariaLabel="Upcoming workshops and events">
            {upcoming.map((event, index) => (
              /* The only priority image below the hero — one preload, on the
                 first card a visitor reaches. */
              <EventCard
                key={event.slug}
                event={event}
                priority={index === 0}
              />
            ))}
          </CardRail>
        ) : (
          <Container>
            <p className="text-muted">
              Nothing scheduled right now. Check back at the start of term.
            </p>
          </Container>
        )}
      </Section>

      {/* 6. Facilities */}
      <Section tone="tint" bleed ariaLabelledBy="home-facilities">
        <Container>
          <SectionHeader
            id="home-facilities"
            title="What you can use"
            description="Fabrication, electronics, and workshop equipment — some open access, some after an induction."
            action={{ label: "See all equipment", href: "/facilities" }}
            className="mb-8"
          />
        </Container>

        <CardRail ariaLabel="Lab facilities">
          {railFacilities.map((facility) => (
            <FacilityCard key={facility.slug} facility={facility} />
          ))}
        </CardRail>
      </Section>

      {/* 7. Portfolio */}
      <Section tone="default" bleed ariaLabelledBy="home-portfolio">
        <Container>
          <SectionHeader
            id="home-portfolio"
            title="Built here"
            description="A sample of what students have made in the lab."
            action={{ label: "See all projects", href: "/portfolio" }}
            className="mb-8"
          />
        </Container>

        <CardRail ariaLabel="Student and lab projects">
          {railProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </CardRail>
      </Section>

      {/* 8. Team */}
      <Section tone="tint" bleed ariaLabelledBy="home-team">
        <Container>
          <SectionHeader
            id="home-team"
            title="The people who run it"
            description="Staff and student coordinators who induct, supervise, and keep the machines alive."
            action={{ label: "Meet the team", href: "/about" }}
            className="mb-8"
          />
        </Container>

        <TeamRail members={team} ariaLabel="The Tinkerer Lab team" />
      </Section>

      {/* 9. Closing CTA — the second dark anchor. */}
      <CTASection
        title="Not sure where to start?"
        description="Come to an induction, or just walk in during open hours and ask."
        primaryAction={{
          label: "See upcoming workshops",
          href: "/workshops",
        }}
        secondaryAction={{ label: "Visit the lab", href: "/help#visit" }}
      />
    </>
  );
}
