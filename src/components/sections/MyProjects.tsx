"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { listMyProjects } from "@/app/actions/projects";
import { CardGrid } from "@/components/sections/CardGrid";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORIES, type Project } from "@/types/user-projects";
import { useAuth } from "@/lib/auth/AuthProvider";

type ProjectRow = { project: Project; isOwner: boolean };

export function MyProjects() {
  const { getIdToken } = useAuth();
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    setRows(null);
    const result = await listMyProjects(await getIdToken());
    if (!result.ok) {
      setError(result.error);
      setRows([]);
      return;
    }
    setRows(result.data);
  }, [getIdToken]);

  useEffect(() => {
    let cancelled = false;
    void listMyProjectsWithToken(getIdToken).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setRows([]);
      } else {
        setRows(result.data);
      }
    });
    return () => { cancelled = true; };
  }, [getIdToken]);

  return (
    <section aria-labelledby="my-projects-heading" className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="my-projects-heading" className="font-display text-h4">My Projects</h2>
          <p className="mt-1 text-small text-muted">Projects you own or are a team member of.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Create Project</Link>
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex flex-col items-start gap-3">
          <StatusMessage status="error">{error}</StatusMessage>
          <Button variant="outline" onClick={() => void refresh()}>Try again</Button>
        </div>
      )}

      {rows === null && <div aria-label="Loading projects" className="mt-5 h-28 animate-pulse rounded-lg bg-primary-tint" />}
      {rows?.length === 0 && !error && (
        <div className="mt-5 rounded-lg border border-border bg-surface p-5">
          <p className="text-muted">No projects yet.</p>
          <Link href="/projects/new" className="mt-2 inline-block text-small font-medium text-primary hover:underline">
            Create your first project
          </Link>
        </div>
      )}
      {!!rows?.length && (
        <CardGrid columns={2} className="mt-8">
          {rows.map(({ project, isOwner }) => (
            <li key={project.projectId}>
              <Link href={`/projects/${project.projectId}`} className="group block h-full overflow-hidden border border-border bg-surface transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:border-primary/40 focus-visible:shadow-lg">
                <div className="relative flex aspect-[16/10] items-end overflow-hidden bg-primary-dark p-6 sm:p-8">
                  <div aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-primary via-primary-dark to-ink opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                  <div aria-hidden="true" className="absolute -right-10 -top-12 size-48 rounded-full border border-accent/40 sm:size-64" />
                  <div aria-hidden="true" className="absolute -right-3 -top-5 size-32 rounded-full border border-accent/25 sm:size-48" />
                  <div className="relative flex w-full items-end justify-between gap-3">
                    <p className="font-display text-5xl font-bold text-accent/90 sm:text-6xl" aria-hidden="true">{project.title.trim().slice(0, 1).toUpperCase()}</p>
                    <span className="border border-surface/40 bg-ink/20 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-surface">{project.status}</span>
                  </div>
                </div>
                <div className="flex min-h-56 flex-col p-5 sm:p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">{PROJECT_CATEGORIES[project.category]}</p>
                  <h3 className="mt-2 line-clamp-2 font-display text-h4 text-primary-dark transition-colors group-hover:text-primary">{project.title}</h3>
                  <p className="mt-3 line-clamp-3 text-small leading-relaxed text-muted">{project.shortDescription}</p>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4 text-xs text-muted">
                    <span>{isOwner ? "Project owner" : "Team member"}</span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </CardGrid>
      )}
    </section>
  );
}

async function listMyProjectsWithToken(getIdToken: () => Promise<string | null>) {
  return listMyProjects(await getIdToken());
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "recently"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
