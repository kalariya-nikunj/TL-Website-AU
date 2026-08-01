import type { Metadata } from "next";

import { TeamCard } from "@/components/cards/TeamCard";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { site } from "@/content/site";
import { team } from "@/content/team";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow={site.university}
        title={`About ${site.name}`}
        description={site.description}
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

      <Section ariaLabelledBy="team">
        <SectionHeader
          id="team"
          title="The team"
          description="Placeholder copy. Staff and student coordinators who run inductions, supervise the shop floor, and maintain the equipment."
        />
        <CardGrid columns={3} className="mt-8">
          {team.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </CardGrid>
      </Section>

      <CTASection
        title="Want to work in the lab?"
        description="Start with an induction workshop — they run every few weeks and cost nothing."
        primaryAction={{ label: "See workshops", href: "/workshops" }}
        secondaryAction={{ label: "Ask a question", href: "/help" }}
      />
    </>
  );
}
