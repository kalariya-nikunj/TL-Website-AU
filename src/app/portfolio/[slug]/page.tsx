import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon, TrophyIcon } from "lucide-react";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/sections/CTASection";
import { CardGrid } from "@/components/sections/CardGrid";
import { DetailList, SidebarField, StatusPill } from "@/components/sections/DetailPanels";
import { ImageGallery } from "@/components/media/ImageGallery";
import { PersonCredit } from "@/components/cards/PersonCredit";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { getFacility } from "@/content/facilities";
import { getProject, projectSlugs, projects } from "@/content/projects";
import { getTeamMember } from "@/content/team";
import { site } from "@/content/site";
import type { Project, ProjectStatus } from "@/types";

const STATUS: Record<
  ProjectStatus,
  { tone: "success" | "warning"; label: string }
> = {
  completed: { tone: "success", label: "Completed" },
  "in-progress": { tone: "warning", label: "In progress" },
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projectSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  return {
    title: project.title,
    description: project.shortDescription,
    openGraph: {
      title: `${project.title} — ${site.name}`,
      description: project.shortDescription,
      images: project.images.slice(0, 1),
    },
  };
}

/** Most tags in common first, then featured. Ties keep content order. */
function related(project: Project): Project[] {
  return projects
    .filter((other) => other.slug !== project.slug)
    .map((other) => ({
      other,
      shared: other.tags.filter((tag) => project.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) =>
        b.shared - a.shared || Number(b.other.featured) - Number(a.other.featured),
    )
    .slice(0, 3)
    .map((entry) => entry.other);
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  /* Unresolvable ids drop out rather than rendering a broken credit. */
  const credits = (project.teamMembers ?? [])
    .map((id) => getTeamMember(id))
    .filter((member) => member !== undefined);

  const machines = (project.facilitiesUsed ?? [])
    .map((facilitySlug) => getFacility(facilitySlug))
    .filter((facility) => facility !== undefined);

  const status = project.status ? STATUS[project.status] : undefined;
  const more = related(project);

  return (
    <>
      {/* Image-led: the gallery runs full width before the columns start. */}
      <Section tone="default">
        <Breadcrumb
          trail={[{ label: "Portfolio", href: "/portfolio" }]}
          current={project.title}
        />

        <div className="mt-8 max-w-3xl">
          <p className="eyebrow">{project.year}</p>
          <h1 className="section-title mt-2">{project.title}</h1>
          <p className="mt-4 text-body text-muted">
            {project.shortDescription}
          </p>
        </div>

        <div className="mt-10">
          <ImageGallery
            size="full"
            priority
            images={project.images.map((src, index) => ({
              src,
              alt:
                index === 0
                  ? `${project.title}, built in the Tinkerer Lab`
                  : `${project.title}, view ${index + 1}`,
            }))}
          />
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
          {/* ---------------- Main ---------------- */}
          <div className="flex flex-col gap-10">
            <p className="max-w-prose text-body text-muted">
              {project.description}
            </p>

            {machines.length > 0 && (
              <section aria-labelledby="how">
                <h2 id="how" className="font-display text-h3 text-primary-dark">
                  How it was made
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {machines.map((facility) => (
                    <li key={facility.slug}>
                      <Link
                        href={`/facilities/${facility.slug}`}
                        className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-primary-tint"
                      >
                        <span className="card-chamfer relative size-14 shrink-0 overflow-hidden bg-primary-tint">
                          <Image
                            src={facility.images[0]}
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-ink transition-colors group-hover:text-primary">
                            {facility.name}
                          </span>
                          <span className="mt-0.5 block truncate text-small text-muted">
                            {facility.shortDescription}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <DetailList
              id="materials"
              title="Materials"
              items={project.materials}
            />
          </div>

          {/* ---------------- Sidebar ---------------- */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {project.award && (
              <div className="flex items-start gap-3 rounded-lg border border-accent bg-accent/15 p-5">
                <TrophyIcon
                  className="mt-0.5 size-5 shrink-0 text-accent-dark"
                  aria-hidden="true"
                />
                <div>
                  <p className="eyebrow">Award</p>
                  <p className="mt-1 text-small text-ink">{project.award}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
              {status && (
                <div>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
              )}

              <SidebarField label="Year">{project.year}</SidebarField>
              <SidebarField label="Duration">{project.duration}</SidebarField>

              <div>
                <p className="eyebrow">Tags</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-lg border border-border px-2 py-0.5 text-small text-muted"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {(credits.length > 0 ||
              (project.externalTeam?.length ?? 0) > 0 ||
              project.team.length > 0) && (
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
                <p className="eyebrow">Built by</p>

                {credits.map((member) => (
                  <PersonCredit key={member.id} member={member} />
                ))}

                {/* Contributors with no team entry get their name and nothing
                    else — inventing a profile for them would be worse. */}
                {(project.externalTeam ?? []).map((name) => (
                  <p key={name} className="text-small text-muted">
                    {name}
                  </p>
                ))}

                {credits.length === 0 &&
                  (project.externalTeam?.length ?? 0) === 0 &&
                  project.team.map((name, index) => (
                    <p key={`${name}-${index}`} className="text-small text-muted">
                      {name}
                    </p>
                  ))}
              </div>
            )}

            {project.links && project.links.length > 0 && (
              <div className="flex flex-col gap-3">
                {project.links.map((link) => (
                  <Button
                    key={link.url}
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                      <ExternalLinkIcon aria-hidden="true" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </aside>
        </div>
      </Section>

      {more.length > 0 && (
        <Section tone="tint" ariaLabelledBy="more-projects">
          <SectionHeader
            id="more-projects"
            title="More projects"
            action={{ label: "Full portfolio", href: "/portfolio" }}
            className="mb-8"
          />
          <CardGrid>
            {more.map((other) => (
              <ProjectCard key={other.slug} project={other} />
            ))}
          </CardGrid>
        </Section>
      )}

      <CTASection
        title="Built something here?"
        description="Send us photos and a short write-up and we will add it to the portfolio."
        primaryAction={{ label: "Submit a project", href: "/help#contact" }}
        secondaryAction={{ label: "See the facilities", href: "/facilities" }}
      />
    </>
  );
}
