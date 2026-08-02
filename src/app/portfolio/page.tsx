import type { Metadata } from "next";

import { CTASection } from "@/components/sections/CTASection";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectGallery } from "@/components/sections/ProjectGallery";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Student and lab projects built in the Tinkerer Lab at Ahmedabad University.",
};

export default function PortfolioPage() {
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

      <Section tone="default" ariaLabelledBy="all-projects">
        <SectionHeader
          id="all-projects"
          title="Every project"
          description="Filter by what a project is made of. Featured work sorts to the front."
          className="mb-8"
        />
        <ProjectGallery projects={projects} />
      </Section>

      <CTASection
        title="Built something here?"
        description="Send us photos and a short write-up and we will add it to the portfolio."
        primaryAction={{ label: "Submit a project", href: "/help#contact" }}
        secondaryAction={{ label: "See the facilities", href: "/facilities" }}
      />
    </>
  );
}
