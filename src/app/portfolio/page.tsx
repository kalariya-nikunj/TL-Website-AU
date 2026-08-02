import type { Metadata } from "next";

import { ProjectCard } from "@/components/cards/ProjectCard";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { featuredProjects, projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Student and lab projects built in the Tinkerer Lab at Ahmedabad University.",
};

export default function PortfolioPage() {
  const featuredSlugs = new Set(featuredProjects.map((p) => p.slug));
  const rest = projects.filter((project) => !featuredSlugs.has(project.slug));

  return (
    <>
      <PageHero
        eyebrow="Built here"
        title="Portfolio"
        subtitle="Projects that came out of the lab — course work, competition entries, and things students built because they wanted to."
        imageDefault="/images/hero/portfolio-a.jpg"
        imageHover="/images/hero/portfolio-b.jpg"
        imageAlt="A finished student project on display in the Tinkerer Lab"
      />

      {featuredProjects.length > 0 && (
        <Section ariaLabelledBy="featured">
          <SectionHeader id="featured" title="Featured" />
          <CardGrid className="mt-8">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </CardGrid>
        </Section>
      )}

      {rest.length > 0 && (
        <Section ariaLabelledBy="all-projects">
          <SectionHeader id="all-projects" title="More projects" />
          <CardGrid className="mt-8">
            {rest.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </CardGrid>
        </Section>
      )}

      <CTASection
        title="Built something here?"
        description="Send us photos and a short write-up and we will add it to the portfolio."
        primaryAction={{ label: "Submit a project", href: "/help" }}
      />
    </>
  );
}
