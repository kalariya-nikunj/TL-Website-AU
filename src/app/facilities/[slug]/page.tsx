import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { CTASection } from "@/components/sections/CTASection";
import { ImagePlaceholder } from "@/components/media/ImagePlaceholder";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { facilitySlugs, getFacility } from "@/content/facilities";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return facilitySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const facility = getFacility(slug);
  if (!facility) return {};

  return {
    title: facility.name,
    description: facility.shortDescription,
  };
}

export default async function FacilityPage({ params }: PageProps) {
  const { slug } = await params;
  const facility = getFacility(slug);
  if (!facility) notFound();

  return (
    <>
      <PageHeader
        eyebrow={facility.category}
        title={facility.name}
        description={facility.shortDescription}
      >
        <Badge variant={facility.requiresTraining ? "default" : "secondary"}>
          {facility.requiresTraining ? "Induction required" : "Open access"}
        </Badge>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <ImagePlaceholder
              label={facility.name}
              className="w-full rounded-xl"
            />
            <div className="mt-8 max-w-2xl text-muted-foreground">
              <p>{facility.description}</p>
            </div>
          </div>

          <dl className="flex h-fit flex-col gap-4 rounded-xl border p-6 text-sm">
            <p className="font-medium">Specifications</p>
            {facility.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{spec.label}</dt>
                <dd className="text-right">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {facility.safetyNotes && facility.safetyNotes.length > 0 && (
        <Section ariaLabelledBy="safety">
          <SectionHeader
            id="safety"
            title="Safety"
            description="Non-negotiable. Breaking these rules ends lab access."
          />
          <ul className="mt-6 flex max-w-2xl list-disc flex-col gap-2 pl-5 text-muted-foreground">
            {facility.safetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Section>
      )}

      <CTASection
        title={
          facility.requiresTraining
            ? `Get inducted on the ${facility.name.toLowerCase()}`
            : `Come and use the ${facility.name.toLowerCase()}`
        }
        description={
          facility.requiresTraining
            ? "Book the induction workshop, then the machine is yours to book."
            : "Open access during lab hours — no booking needed."
        }
        primaryAction={{ label: "See workshops", href: "/workshops" }}
        secondaryAction={{ label: "Lab hours & contact", href: "/help" }}
      />
    </>
  );
}
