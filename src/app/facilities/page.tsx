import type { Metadata } from "next";

import { FacilityCard } from "@/components/cards/FacilityCard";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { facilities } from "@/content/facilities";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Fabrication, electronics, and workshop equipment available to students at the Tinkerer Lab.",
};

export default function FacilitiesPage() {
  const categories = [...new Set(facilities.map((f) => f.category))];

  return (
    <>
      <PageHero
        eyebrow="Machines & workshops"
        title="Facilities"
        subtitle="Everything in the lab, and what it takes to get access to it. Machines marked “induction required” need a short workshop first."
        imageDefault="/images/hero/facilities-a.jpg"
        imageHover="/images/hero/facilities-b.jpg"
        imageAlt="Fabrication equipment on the Tinkerer Lab shop floor"
      />

      {categories.map((category) => {
        const id = `category-${category.toLowerCase().replace(/\s+/g, "-")}`;
        const inCategory = facilities.filter((f) => f.category === category);

        return (
          <Section key={category} ariaLabelledBy={id}>
            <SectionHeader id={id} title={category} />
            <CardGrid className="mt-8">
              {inCategory.map((facility) => (
                <FacilityCard key={facility.slug} facility={facility} />
              ))}
            </CardGrid>
          </Section>
        );
      })}

      <CTASection
        title="Need an induction?"
        description="Inductions run as short workshops. Book one and the machine is yours to use."
        primaryAction={{ label: "See workshops", href: "/workshops" }}
      />
    </>
  );
}
