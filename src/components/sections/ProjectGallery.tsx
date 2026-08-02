"use client";

import { useMemo, useState } from "react";

import { CardGrid } from "@/components/sections/CardGrid";
import { FilterChip } from "@/components/ui/filter-chip";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";

/**
 * The portfolio grid with tag filters.
 *
 * Projects are the one thing on this site that genuinely is visual, so cards
 * are right here where rows were right for events.
 *
 * Filtering hides and reorders. There is no layout animation and no library —
 * a grid that reflows instantly is easier to read than one that slides, and it
 * cannot get out of sync with the count.
 */

type ProjectGalleryProps = {
  projects: Project[];
};

export function ProjectGallery({ projects }: ProjectGalleryProps) {
  const [selected, setSelected] = useState<string[]>([]);

  /* Union of every tag in use, alphabetical so the row is stable between
     builds and does not reorder when content is added. */
  const tags = useMemo(
    () => [...new Set(projects.flatMap((project) => project.tags))].sort(),
    [projects],
  );

  const visible = useMemo(() => {
    const matched =
      selected.length === 0
        ? projects
        : /* OR, not AND: picking a second tag should widen the result, which is
             what selecting more of something implies. */
          projects.filter((project) =>
            project.tags.some((tag) => selected.includes(tag)),
          );

    /* Featured first, then the original order — a stable sort keeps it. */
    return [...matched].sort(
      (a, b) => Number(b.featured) - Number(a.featured),
    );
  }, [projects, selected]);

  const toggle = (tag: string) =>
    setSelected((current) =>
      current.includes(tag)
        ? current.filter((value) => value !== tag)
        : [...current, tag],
    );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip pressed={selected.length === 0} onClick={() => setSelected([])}>
          All
        </FilterChip>

        {tags.map((tag) => (
          <FilterChip
            key={tag}
            pressed={selected.includes(tag)}
            onClick={() => toggle(tag)}
          >
            {tag}
          </FilterChip>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-small text-muted">
        Showing {visible.length} of {projects.length}{" "}
        {projects.length === 1 ? "project" : "projects"}
      </p>

      {visible.length === 0 ? (
        <div className="mt-8 border-t border-border pt-8">
          <p className="text-body text-muted">No projects match those tags.</p>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="mt-4"
            onClick={() => setSelected([])}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <CardGrid className="mt-8">
          {visible.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </CardGrid>
      )}
    </div>
  );
}
