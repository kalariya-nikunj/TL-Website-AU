import type { Metadata } from "next";

import { CTASection } from "@/components/sections/CTASection";
import { FacilityExplorer } from "@/components/sections/FacilityExplorer";
import { PageHero } from "@/components/sections/PageHero";
import { machineryDisplayName, machineryImageById, machineryItems } from "@/content/machinery";
import { facilities } from "@/content/facilities";
import type { Facility } from "@/types";

const facilityDirectory: Facility[] = [
  ...facilities,
  ...machineryItems.map((item) => {
    const model = item.description.replace(/^Consumable Link\s*[·-]\s*/i, "");
    const name = machineryDisplayName[item.itemId] ?? item.name;
    const image = machineryImageById[item.itemId];

    return {
      slug: `inventory-${item.itemId}`,
      name,
      category: item.category,
      shortDescription: model || "Machine listed in the Tinkerers Lab inventory.",
      description: model
        ? `${name} · ${model}`
        : `${name}, listed in the Tinkerers Lab machinery inventory.`,
      specs: [
        ...(model ? [{ label: "Make / Model", value: model }] : []),
        { label: "Quantity", value: String(item.totalQuantity) },
        ...(item.sourceStatus
          ? [{ label: "Current status", value: item.sourceStatus }]
          : []),
      ],
      images: [image],
      requiresTraining: false,
      catalogOnly: true,
      ...(item.detailsUrl ? { detailsUrl: item.detailsUrl } : {}),
    };
  }),
];

const facilityImageOverrides: Record<string, string> = {
  "laser-cutter": "/images/home-facilities/laser-cutter.jpg",
  "3d-printing": "/images/home-facilities/3d-printing.jpg",
  "cnc-router": "/images/home-facilities/cnc-router.jpg",
  "electronics-bench": "/images/home-facilities/electronics-bench.jpg",
  "woodworking-shop": "/images/home-facilities/woodworking-shop.jpg",
};

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
      <FacilityExplorer
        facilities={facilityDirectory}
        imageOverrides={facilityImageOverrides}
      />

      <CTASection
        title="Need an induction?"
        description="Inductions run as short workshops. Book one and the machine is yours to use."
        primaryAction={{ label: "See workshops", href: "/workshops" }}
      />
    </>
  );
}
