"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { PublicProjectSummary } from "@/lib/projects/public";
import { CardGrid } from "@/components/sections/CardGrid";
import { FilterChip } from "@/components/ui/filter-chip";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORIES } from "@/types/user-projects";

export function PublicProjectGallery({ projects }: { projects: PublicProjectSummary[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const tags = useMemo(
    () => [...new Set(projects.flatMap((project) => [PROJECT_CATEGORIES[project.category], ...project.tags]))].sort(),
    [projects],
  );
  const visible = selected.length
    ? projects.filter((project) => [PROJECT_CATEGORIES[project.category], ...project.tags].some((tag) => selected.includes(tag)))
    : projects;

  function toggle(tag: string) {
    setSelected((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip pressed={selected.length === 0} onClick={() => setSelected([])}>All</FilterChip>
        {tags.map((tag) => <FilterChip key={tag} pressed={selected.includes(tag)} onClick={() => toggle(tag)}>{tag}</FilterChip>)}
      </div>
      <p aria-live="polite" className="mt-4 text-small text-muted">
        Showing {visible.length} of {projects.length} {projects.length === 1 ? "project" : "projects"}
      </p>

      {visible.length === 0 ? (
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-body text-muted">{projects.length ? "No projects match those tags." : "No active student projects yet. Check back soon."}</p>
          {selected.length > 0 && <Button type="button" size="lg" variant="outline" className="mt-4" onClick={() => setSelected([])}>Clear filters</Button>}
        </div>
      ) : (
        <CardGrid className="mt-8">
          {visible.map((project) => (
            <li key={project.projectId}>
              <Link href={`/projects/${project.projectId}`} className="group relative block aspect-4/5 w-full focus-visible:outline-offset-4">
                <div className="card-chamfer absolute inset-0 overflow-hidden bg-primary-dark">
                  {project.images[0] ? (
                    <Image src={project.images[0]} alt={`${project.title}, built in the Tinkerer Lab`} fill sizes="(min-width: 48rem) 22rem, 90vw" className="object-cover transition-[scale] duration-400 ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105" />
                  ) : (
                    <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-linear-to-br from-primary via-primary-dark to-ink">
                      <span className="font-display text-8xl font-bold text-accent/80">{project.title.trim().slice(0, 1).toUpperCase()}</span>
                      <span className="absolute -right-12 -top-16 size-64 rounded-full border border-accent/30" />
                    </div>
                  )}
                  <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-primary-dark/95" />
                  <span className="card-badge absolute left-4 top-4 px-2.5 py-1">{project.year}</span>
                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
                    <p className="text-xs font-medium text-background/80">{PROJECT_CATEGORIES[project.category]}</p>
                    <h2 className="line-clamp-2 font-display text-card-title text-background">{project.title}</h2>
                    <p className="line-clamp-2 text-small text-background/80">{project.shortDescription}</p>
                    {!!project.tags.length && <div className="mt-1 flex flex-wrap gap-1.5">{project.tags.slice(0, 3).map((tag) => <span key={tag} className="border border-background/40 px-2 py-0.5 text-xs text-background/80">{tag}</span>)}</div>}
                  </div>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-400 ease-out motion-safe:group-hover:scale-x-100 motion-safe:group-focus-visible:scale-x-100" />
                </div>
              </Link>
            </li>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
