import { EventCard } from "@/components/cards/EventCard";
import { FacilityCard } from "@/components/cards/FacilityCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import { CardRail } from "@/components/sections/CardRail";
import { VideoHero } from "@/components/sections/VideoHero";
import { NewsStrip } from "@/components/sections/NewsStrip";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { facilities } from "@/content/facilities";
import { getUpcomingEvents } from "@/content/events";
import { news } from "@/content/news";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import { team } from "@/content/team";

/**
 * The upcoming list is filtered against the current time, so the page is
 * revalidated hourly rather than frozen at build time.
 */
export const revalidate = 3600;

export default function HomePage() {
  /* The rails scroll, so they carry more than a three-card preview would. */
  const upcoming = getUpcomingEvents(8);
  const previewTeam = team.slice(0, 4);

  return (
    <>
      {/* 1. Hero — scroll-driven video sequence */}
      <VideoHero />

      {/* 2. News */}
      <NewsStrip items={news} />

      {/* 3. About preview */}
      <Section ariaLabelledBy="home-about">
        <SectionHeader
          id="home-about"
          title="A workshop that belongs to the students"
          description={`${site.name} is open to every student of ${site.university}. Bring an idea, learn the machine that makes it, and build it here.`}
          action={{ label: "About the lab", href: "/about" }}
        />
      </Section>

      {/* 4. Team preview */}
      <Section ariaLabelledBy="home-team">
        <SectionHeader
          id="home-team"
          title="The people who run it"
          description="Staff and student coordinators who induct, supervise, and keep the machines alive."
          action={{ label: "Meet the team", href: "/about#team" }}
        />
        <CardGrid columns={4} className="mt-8">
          {previewTeam.map((member) => (
            <TeamCard key={member.id} member={member} compact />
          ))}
        </CardGrid>
      </Section>

      {/* 5. Workshops preview */}
      {upcoming.length > 0 ? (
        <CardRail
          id="home-workshops"
          title="Next up"
          description="Inductions, workshops, and open days. Most need a free place booked in advance."
          action={{ label: "Discover all", href: "/workshops" }}
          ariaLabel="Upcoming workshops and events"
        >
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
        <Section ariaLabelledBy="home-workshops">
          <SectionHeader
            id="home-workshops"
            title="Next up"
            action={{ label: "Discover all", href: "/workshops" }}
          />
          <p className="mt-8 text-muted">
            Nothing scheduled right now. Check back at the start of term.
          </p>
        </Section>
      )}

      {/* 6. Facilities preview */}
      <CardRail
        id="home-facilities"
        title="What you can use"
        description="Fabrication, electronics, and workshop equipment — some open access, some after an induction."
        action={{ label: "Discover all", href: "/facilities" }}
        ariaLabel="Lab facilities"
      >
        {facilities.map((facility) => (
          <FacilityCard key={facility.slug} facility={facility} />
        ))}
      </CardRail>

      {/* 7. Portfolio preview */}
      <CardRail
        id="home-portfolio"
        title="Built here"
        description="A sample of what students have made in the lab."
        action={{ label: "Discover all", href: "/portfolio" }}
        ariaLabel="Student and lab projects"
      >
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </CardRail>

      {/* 8. Help / contact CTA */}
      <CTASection
        title="Not sure where to start?"
        description="Read the FAQ, or send us a message and someone from the lab will get back to you."
        primaryAction={{ label: "Get help", href: "/help" }}
        secondaryAction={{ label: "Sign in", href: "/login" }}
      />
    </>
  );
}
