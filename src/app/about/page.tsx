import type { Metadata } from "next";

import { CTASection } from "@/components/sections/CTASection";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { TeamRail } from "@/components/sections/TeamRail";
import { site } from "@/content/site";
import { team } from "@/content/team";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={site.university}
        title={`About ${site.name}`}
        subtitle={site.description}
        imageDefault="/images/hero/about-a.jpg"
        imageHover="/images/hero/about-b.jpg"
        imageAlt="Students working at the benches in the Tinkerer Lab"
      />

      <Section ariaLabelledBy="about-what">
        <SectionHeader id="about-what" title="What the lab is for" />
        <div className="mt-6 grid max-w-4xl gap-4 text-muted">
          <p>
            Placeholder copy. The lab exists so that a student with an idea has
            somewhere to make it real — not eventually, and not only if it is
            part of a course.
          </p>
          <p>
            Placeholder copy. It brings fabrication, electronics, and workshop
            equipment into one supervised space, with the training needed to use
            each machine safely.
          </p>
        </div>
      </Section>

      {/* `id="team"` is the target of /about#team from the header and footer —
          it has to stay on the heading. */}
      <TeamRail
        id="team"
        title="The team"
        description="Placeholder copy. Staff and student coordinators who run inductions, supervise the shop floor, and maintain the equipment."
        members={team}
      />

      <CTASection
        title="Want to work in the lab?"
        description="Start with an induction workshop — they run every few weeks and cost nothing."
        primaryAction={{ label: "See workshops", href: "/workshops" }}
        secondaryAction={{ label: "Ask a question", href: "/help" }}
      />
    </>
  );
}
