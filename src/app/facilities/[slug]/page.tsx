import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlertIcon } from "lucide-react";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import {
  CheckList,
  MaterialsPanels,
  SidebarField,
  SpecList,
  StatusPill,
} from "@/components/sections/DetailPanels";
import { ImageGallery } from "@/components/media/ImageGallery";
import { PersonCredit } from "@/components/cards/PersonCredit";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { facilities, facilitySlugs, getFacility } from "@/content/facilities";
import { getTeamMember } from "@/content/team";
import { projects } from "@/content/projects";
import { site } from "@/content/site";
import type { FacilityStatus } from "@/types";

/** Booking lands in Phase 4. One constant to repoint when it does. */
const BOOKING_HREF = "/help#contact";

const STATUS: Record<
  FacilityStatus,
  { tone: "success" | "warning" | "muted"; label: string }
> = {
  available: { tone: "success", label: "Available now" },
  maintenance: { tone: "warning", label: "Under maintenance" },
  retired: { tone: "muted", label: "Retired" },
};

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
    openGraph: {
      title: `${facility.name} — ${site.name}`,
      description: facility.shortDescription,
      images: facility.images.slice(0, 1),
    },
  };
}

export default async function FacilityPage({ params }: PageProps) {
  const { slug } = await params;
  const facility = getFacility(slug);
  if (!facility) notFound();

  /* Cross-references resolve by id. An id that no longer matches anything is
     skipped, not thrown on — content and code are edited independently. */
  const supervisor = facility.supervisor
    ? getTeamMember(facility.supervisor)
    : undefined;

  const madeWith = projects.filter((project) =>
    project.facilitiesUsed?.includes(facility.slug),
  );

  const siblings = facilities
    .filter(
      (other) =>
        other.category === facility.category && other.slug !== facility.slug,
    )
    .slice(0, 3);

  const status = facility.status ? STATUS[facility.status] : undefined;

  return (
    <>
      <Section tone="default">
        <Breadcrumb
          trail={[{ label: "Facilities", href: "/facilities" }]}
          current={facility.name}
        />

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
          {/* ---------------- Main ---------------- */}
          <div className="flex flex-col gap-10">
            <div>
              <p className="eyebrow">{facility.category}</p>
              <h1 className="section-title mt-2">{facility.name}</h1>
              <p className="mt-4 max-w-prose text-body text-muted">
                {facility.shortDescription}
              </p>
            </div>

            <ImageGallery
              size="full"
              priority
              images={facility.images.map((src, index) => ({
                src,
                alt:
                  index === 0
                    ? `${facility.name} in the Tinkerer Lab`
                    : `${facility.name}, view ${index + 1}`,
              }))}
            />

            <p className="max-w-prose text-body text-muted">
              {facility.description}
            </p>

            <CheckList
              id="makes"
              title="What you can make with it"
              items={facility.makes}
            />

            <MaterialsPanels
              works={facility.materials}
              never={facility.notSupported}
            />

            {facility.safetyNotes && facility.safetyNotes.length > 0 && (
              <section
                aria-labelledby="safety"
                className="rounded-lg border border-destructive bg-destructive-tint p-6"
              >
                <h2
                  id="safety"
                  className="flex items-center gap-2 font-display text-h3 text-destructive-dark"
                >
                  <ShieldAlertIcon className="size-5" aria-hidden="true" />
                  Safety
                </h2>
                <p className="mt-2 text-small text-destructive-dark">
                  Non-negotiable. Breaking these rules ends lab access.
                </p>
                <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-small text-destructive-dark">
                  {facility.safetyNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ---------------- Sidebar ----------------
              `self-start` matters: a stretched grid item is as tall as the row,
              and a sticky element cannot move inside a box it already fills. */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {status && (
              <div>
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
              </div>
            )}

            <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
              <div>
                <p className="eyebrow">Specifications</p>
                <div className="mt-3">
                  <SpecList specs={facility.specs} />
                </div>
              </div>

              <SidebarField label="Location">{facility.location}</SidebarField>

              <SidebarField label="Software">
                {facility.softwareRequired?.join(", ")}
              </SidebarField>

              <SidebarField label="File formats">
                {facility.fileFormats?.join(", ")}
              </SidebarField>

              <SidebarField label="Lead time">{facility.leadTime}</SidebarField>

              <SidebarField label="Cost">{facility.cost}</SidebarField>
            </div>

            {facility.requiresTraining && (
              <div className="rounded-lg border border-border bg-primary-tint p-6">
                <p className="eyebrow">Induction required</p>
                <p className="mt-2 text-small text-ink">
                  {facility.trainingLength
                    ? `${facility.trainingLength}, then the machine is yours to book.`
                    : "A short induction unlocks independent access."}
                </p>
                <Link
                  href="/workshops"
                  className="hover-underline mt-3 inline-block text-small font-medium text-primary"
                >
                  Find an induction
                </Link>
              </div>
            )}

            {supervisor && (
              <div className="rounded-lg border border-border bg-surface p-6">
                <p className="eyebrow mb-3">Who looks after it</p>
                <PersonCredit member={supervisor} role="Supervisor" />
              </div>
            )}

            <Button asChild size="lg" variant="accent" className="w-full">
              <Link href={BOOKING_HREF}>Book this machine</Link>
            </Button>
          </aside>
        </div>
      </Section>

      {madeWith.length > 0 && (
        <Section tone="tint" ariaLabelledBy="made-with">
          <SectionHeader
            id="made-with"
            title="Projects made with this machine"
            className="mb-8"
          />
          <CardGrid>
            {madeWith.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </CardGrid>
        </Section>
      )}

      {siblings.length > 0 && (
        <Section tone="default" ariaLabelledBy="siblings">
          <SectionHeader
            id="siblings"
            title={`Other ${facility.category.toLowerCase()} equipment`}
            action={{ label: "All equipment", href: "/facilities" }}
            className="mb-8"
          />
          <ul className="flex flex-col border-t border-border">
            {siblings.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/facilities/${other.slug}`}
                  className="group flex items-center justify-between gap-6 border-b border-border py-4 transition-colors hover:bg-primary-tint"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-h3 text-ink transition-colors group-hover:text-primary">
                      {other.name}
                    </span>
                    <span className="mt-1 block text-small text-muted">
                      {other.shortDescription}
                    </span>
                  </span>
                </Link>
              </li>
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
        primaryAction={{ label: "See upcoming workshops", href: "/workshops" }}
        secondaryAction={{ label: "Lab hours & contact", href: "/help" }}
      />
    </>
  );
}
