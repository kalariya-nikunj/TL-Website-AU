"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { listMyProjects } from "@/app/actions/projects";
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
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {rows.map(({ project, isOwner }) => (
            <li key={project.projectId}>
              <Link href={`/projects/${project.projectId}`} className="block h-full rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-primary-tint focus-visible:bg-primary-tint">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-display text-h4 text-ink">{project.title}</h3>
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary">{project.status}</span>
                </div>
                <p className="mt-2 text-small font-medium text-primary">{PROJECT_CATEGORIES[project.category]}</p>
                <p className="mt-2 line-clamp-3 text-small text-muted">{project.shortDescription}</p>
                <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-muted">
                  <span>{isOwner ? "Owner" : "Team member"}</span>
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
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
