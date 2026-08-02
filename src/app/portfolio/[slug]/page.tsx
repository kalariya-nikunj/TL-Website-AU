import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ImageGallery } from "@/components/media/ImageGallery";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { getProject, projectSlugs } from "@/content/projects";

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
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        eyebrow={String(project.year)}
        title={project.title}
        description={project.shortDescription}
      >
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
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
            <div className="mt-8 max-w-2xl text-muted">
              <p>{project.description}</p>
            </div>
          </div>

          <div className="flex h-fit flex-col gap-4 rounded-lg border bg-surface p-6 text-small">
            <div>
              <p className="font-medium">Team</p>
              <ul className="mt-2 flex flex-col gap-1 text-muted">
                {project.team.map((member, index) => (
                  <li key={`${member}-${index}`}>{member}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Year</p>
              <p className="mt-1 text-muted">{project.year}</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
