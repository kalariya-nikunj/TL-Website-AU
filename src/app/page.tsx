import { EventCard } from "@/components/cards/EventCard";
import { FacilityCard } from "@/components/cards/FacilityCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import { VideoHero } from "@/components/sections/VideoHero";
import { NewsStrip } from "@/components/sections/NewsStrip";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { facilities } from "@/content/facilities";
import { getUpcomingEvents } from "@/content/events";
import { news } from "@/content/news";
import { featuredProjects } from "@/content/projects";
import { site } from "@/content/site";
import { team } from "@/content/team";

/**
 * The "next 3 events" list is filtered against the current time, so the page is
 * revalidated hourly rather than frozen at build time.
 */
export const revalidate = 3600;

export default function HomePage() {
  const upcoming = getUpcomingEvents(3);
  const previewFacilities = facilities.slice(0, 3);
  const previewProjects = featuredProjects.slice(0, 3);
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
      <Section ariaLabelledBy="home-workshops">
        <SectionHeader
          id="home-workshops"
          title="Next up"
          description="Inductions, workshops, and open days. Most need a free place booked in advance."
          action={{ label: "All workshops", href: "/workshops" }}
        />
        {upcoming.length > 0 ? (
          <CardGrid className="mt-8">
            {upcoming.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </CardGrid>
        ) : (
          <p className="mt-8 text-muted">
            Nothing scheduled right now. Check back at the start of term.
          </p>
        )}
      </Section>

      {/* 6. Facilities preview */}
      <Section ariaLabelledBy="home-facilities">
        <SectionHeader
          id="home-facilities"
          title="What you can use"
          description="Fabrication, electronics, and workshop equipment — some open access, some after an induction."
          action={{ label: "All facilities", href: "/facilities" }}
        />
        <CardGrid className="mt-8">
          {previewFacilities.map((facility) => (
            <FacilityCard key={facility.slug} facility={facility} />
          ))}
        </CardGrid>
      </Section>

      {/* 7. Portfolio preview */}
      <Section ariaLabelledBy="home-portfolio">
        <SectionHeader
          id="home-portfolio"
          title="Built here"
          description="A sample of what students have made in the lab."
          action={{ label: "Full portfolio", href: "/portfolio" }}
        />
        <CardGrid className="mt-8">
          {previewProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </CardGrid>
      </Section>

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
