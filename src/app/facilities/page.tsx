import type { Metadata } from "next";

import { CTASection } from "@/components/sections/CTASection";
import { FacilityExplorer } from "@/components/sections/FacilityExplorer";
import { PageHero } from "@/components/sections/PageHero";
import { facilities } from "@/content/facilities";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Fabrication, electronics, and workshop equipment available to students at the Tinkerer Lab.",
};

export default function FacilitiesPage() {
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

      {/* Rows rather than cards: a catalogue is scanned for one machine, and
          each row carries its own category, so the old per-category sections
          would repeat it. */}
      <FacilityExplorer facilities={facilities} />

      <CTASection
        title="Need an induction?"
        description="Inductions run as short workshops. Book one and the machine is yours to use."
        primaryAction={{ label: "See workshops", href: "/workshops" }}
      />
    </>
  );
}
