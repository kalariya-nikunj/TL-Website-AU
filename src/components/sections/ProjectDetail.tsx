"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLinkIcon, TrophyIcon } from "lucide-react";

import { addProjectMember, getProject, getPublicProject, removeProjectMember, searchProjectMembers } from "@/app/actions/projects";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_CATEGORIES, type ProjectDetailData, type ProjectMemberCandidate } from "@/types/user-projects";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ProjectEquipmentUsage } from "@/components/sections/ProjectEquipmentUsage";
import { DetailList, SidebarField, StatusPill } from "@/components/sections/DetailPanels";
import { ImageGallery } from "@/components/media/ImageGallery";

type ProjectDetailProps = { projectId: string };

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { user, loading, getIdToken } = useAuth();
  const [view, setView] = useState<ProjectDetailData | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProjectMemberCandidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [memberPending, setMemberPending] = useState("");

  const fetchProject = useCallback(async () => getProject(await getIdToken(), projectId), [getIdToken, projectId]);

  const searchMembers = useCallback(async (term: string) => {
    setSearching(true);
    const result = await searchProjectMembers(await getIdToken(), projectId, term);
    setSearching(false);
    if (!result.ok) {
      setError(result.error);
      setResults(null);
      setNotice("");
    } else {
      setError("");
      setResults(result.data);
      setNotice(result.data.length === 0 ? "No matching users found." : "");
    }
  }, [getIdToken, projectId]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    void (async () => {
      if (user) {
        const privateResult = await fetchProject();
        if (cancelled) return;
        if (privateResult.ok) {
          setView(privateResult.data);
          setLoadingProject(false);
          return;
        }
      }
      const publicResult = await getPublicProject(projectId);
      if (cancelled) return;
      if (!publicResult.ok) setError(publicResult.error);
      else setView(publicResult.data);
      setLoadingProject(false);
    })();
    return () => { cancelled = true; };
  }, [fetchProject, loading, projectId, user]);

  useEffect(() => {
    const term = search.trim();
    if (!view?.viewerIsOwner || term.length < 2) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setSearching(true);
        const result = await searchProjectMembers(await getIdToken(), projectId, term);
        if (cancelled) return;
        setSearching(false);
        if (!result.ok) {
          setError(result.error);
          setResults(null);
          setNotice("");
        } else {
          setError("");
          setResults(result.data);
          setNotice(result.data.length === 0 ? "No matching users found." : "");
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [getIdToken, projectId, search, view?.viewerIsOwner]);

  async function refreshProject() {
    const result = await fetchProject();
    if (!result.ok) setError(result.error);
    else setView(result.data);
  }

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (search.trim().length >= 2) await searchMembers(search.trim());
  }

  async function addMember(candidate: ProjectMemberCandidate) {
    setMemberPending(candidate.uid);
    setError("");
    setNotice("");
    const result = await addProjectMember(await getIdToken(), projectId, candidate.uid);
    setMemberPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice(`${result.data.name} was added to the project.`);
    setResults((current) => current?.filter((item) => item.uid !== candidate.uid) ?? null);
    await refreshProject();
  }

  async function removeMember(uid: string, name: string) {
    setMemberPending(uid);
    setError("");
    setNotice("");
    const result = await removeProjectMember(await getIdToken(), projectId, uid);
    setMemberPending("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice(`${name} was removed from the project.`);
    await refreshProject();
  }

  if (loading || loadingProject) {
    return <div aria-label="Loading project" className="h-48 animate-pulse rounded-lg bg-primary-tint" />;
  }
  if (!view) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4">
        <StatusMessage status="error">{error || "Project not found or you do not have access."}</StatusMessage>
        <Button asChild variant="outline"><Link href="/profile">Back to profile</Link></Button>
      </div>
    );
  }

  const { project } = view;
  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-muted">
        <Link href="/profile" className="hover:text-primary">My Projects</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="truncate text-ink">{project.title}</span>
      </nav>

      <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{PROJECT_CATEGORIES[project.category]}</p>
          <h1 className="mt-2 font-display text-h2 text-primary-dark">{project.title}</h1>
          <p className="mt-2 max-w-3xl text-small text-muted">{project.shortDescription}</p>
        </div>
        {view.viewerIsOwner && (
          <Button asChild variant="outline"><Link href={`/projects/${project.projectId}/edit`}>Edit project</Link></Button>
        )}
      </header>

      {project.images?.length ? (
        <ImageGallery images={project.images.map((src, index) => ({ src, alt: `${project.title}, view ${index + 1}` }))} priority />
      ) : (
        <div className="card-chamfer relative flex min-h-64 items-end overflow-hidden bg-primary-dark p-6 sm:min-h-80 sm:p-10 lg:min-h-[26rem]">
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-primary via-primary-dark to-ink" />
          <div aria-hidden="true" className="absolute -right-16 -top-32 size-80 rounded-full border border-accent/35 sm:size-[28rem]" />
          <div aria-hidden="true" className="absolute right-8 top-8 size-40 rounded-full border border-surface/10 sm:right-24 sm:top-16 sm:size-64" />
          <div aria-hidden="true" className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="relative flex w-full flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Tinkerer Lab · Project</p>
              <p aria-hidden="true" className="mt-4 font-display text-6xl font-bold leading-none text-accent/90 sm:text-8xl">{project.title.trim().slice(0, 1).toUpperCase()}</p>
            </div>
            <span className="border border-surface/40 bg-ink/20 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-surface">{project.status}</span>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className="space-y-6 lg:col-span-3">
          <section aria-labelledby="project-overview-heading" className="border border-border bg-surface p-6 sm:p-8">
            <p className="eyebrow">Project overview</p>
            <h2 id="project-overview-heading" className="mt-2 font-display text-h4 text-primary-dark">About this project</h2>
            <div className="mt-4 whitespace-pre-wrap text-small leading-relaxed text-muted">{project.description}</div>
            {project.facilitiesUsed?.length ? (
              <section aria-labelledby="how-it-was-made" className="mt-7">
                <h3 id="how-it-was-made" className="font-display text-h4 text-primary-dark">How it was made</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {project.facilitiesUsed.map((facility) => (
                    <li key={facility} className="flex items-center gap-4 border border-border bg-surface p-3">
                      <span aria-hidden="true" className="card-chamfer grid size-14 shrink-0 place-items-center bg-primary text-lg font-bold text-accent">TL</span>
                      <span className="font-medium text-ink">{facility}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <div className="mt-7">
              <DetailList id="project-materials" title="Materials" items={project.materials} />
            </div>
            <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              <DetailValue label="Department" value={project.department} />
              <DetailValue label="Branch" value={project.branch} />
              <DetailValue label="Professor" value={project.professorName} />
              <DetailValue label="Contact email" value={project.contactEmail} href={project.contactEmail ? `mailto:${project.contactEmail}` : undefined} />
              <DetailValue label="Contact phone" value={project.contactPhone} href={project.contactPhone ? `tel:${project.contactPhone}` : undefined} />
              <DetailValue label="Instagram" value={project.instagramUrl ? "Open Instagram" : undefined} href={project.instagramUrl} external />
              <DetailValue label="Created" value={formatDate(project.createdAt)} />
              <DetailValue label="Updated" value={formatDate(project.updatedAt)} />
            </dl>
          </section>
          <ProjectEquipmentUsage projectId={project.projectId} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-2 lg:self-start">
          {project.award && (
            <div className="flex items-start gap-3 rounded-lg border border-accent bg-accent/15 p-5">
              <TrophyIcon className="mt-0.5 size-5 shrink-0 text-accent-dark" aria-hidden="true" />
              <div><p className="eyebrow">Award</p><p className="mt-1 text-small text-ink">{project.award}</p></div>
            </div>
          )}
          <div className="flex flex-col gap-5 border border-border bg-surface p-6">
            <StatusPill tone={project.status === "COMPLETED" ? "success" : project.status === "ACTIVE" ? "warning" : "muted"}>{project.status === "COMPLETED" ? "Completed" : project.status === "ACTIVE" ? "In progress" : "Archived"}</StatusPill>
            <SidebarField label="Year">{project.createdAt ? new Date(project.createdAt).getFullYear() : undefined}</SidebarField>
            <SidebarField label="Duration">{project.duration}</SidebarField>
            <div>
              <p className="eyebrow">Tags</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {(project.tags?.length ? project.tags : [PROJECT_CATEGORIES[project.category], project.department, project.branch].filter((tag): tag is string => Boolean(tag))).map((tag) => <li key={tag} className="border border-border px-2 py-0.5 text-xs text-muted">{tag}</li>)}
              </ul>
            </div>
          </div>

          <section aria-labelledby="project-team-heading" className="border border-border bg-surface p-6 sm:p-8">
            <p className="eyebrow">Built by</p>
            <h2 id="project-team-heading" className="mt-2 font-display text-h4 text-primary-dark">Team Members</h2>
            <p className="mt-1 text-small text-muted">Project owner and team members.</p>
            <ul className="mt-5 divide-y divide-border">
              {view.members.map((member) => (
                <li key={member.uid} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-ink">{member.name} <span className="ml-1 text-xs font-normal text-muted">{member.role}</span></p>
                    {member.email && <p className="mt-1 text-small text-muted">{member.email}</p>}
                  </div>
                  {view.viewerIsOwner && member.role !== "OWNER" && (
                    <Button size="sm" variant="outline" disabled={Boolean(memberPending)} onClick={() => void removeMember(member.uid, member.name)}>
                      {memberPending === member.uid ? "Removing…" : "Remove"}
                    </Button>
                  )}
                </li>
              ))}
              {project.externalTeam?.map((name) => (
                <li key={name} className="py-4 text-small text-muted">{name}</li>
              ))}
            </ul>

            {view.viewerIsOwner && (
              <form onSubmit={submitSearch} className="mt-6 border-t border-border pt-6">
                <label htmlFor="member-search" className="text-small font-medium text-ink">Add team member</label>
                <p className="mt-1 text-small text-muted">Search by name, university email, or enrollment number.</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input id="member-search" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(results?.length)} aria-controls="member-search-suggestions" minLength={2} maxLength={100} value={search} onChange={(event) => {
                    const value = event.target.value;
                    setSearch(value);
                    if (value.trim().length < 2) {
                      setResults(null);
                      setSearching(false);
                      setNotice("");
                    }
                  }} placeholder="Search by name, university email, or enrollment number" />
                  <Button type="submit" variant="outline" disabled={searching || search.trim().length < 2}>
                    {searching ? "Searching…" : "Search"}
                  </Button>
                </div>
                {searching && <p role="status" className="mt-3 text-xs text-muted">Searching…</p>}
                {notice && <StatusMessage status="success" className="mt-4">{notice}</StatusMessage>}
                {error && <StatusMessage status="error" className="mt-4">{error}</StatusMessage>}
                {results && results.length > 0 && (
                  <ul id="member-search-suggestions" role="listbox" aria-label="Matching users" className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface px-4">
                    {results.map((candidate) => (
                      <li key={candidate.uid} role="none">
                        <button type="button" role="option" aria-selected="false" disabled={Boolean(memberPending)} onClick={() => void addMember(candidate)} className="flex w-full flex-wrap items-center justify-between gap-3 py-3 text-left hover:text-primary disabled:opacity-50">
                          <span>
                            <span className="block font-medium text-ink">{candidate.name}</span>
                            <span className="block text-small text-muted">{candidate.email}</span>
                          </span>
                          <span className="text-small font-medium text-primary">{memberPending === candidate.uid ? "Adding…" : "Add"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            )}
            {!view.viewerIsOwner && notice && <StatusMessage status="success" className="mt-4">{notice}</StatusMessage>}
            {!view.viewerIsOwner && error && <StatusMessage status="error" className="mt-4">{error}</StatusMessage>}
          </section>
          {project.sourceCodeUrl && <ExternalProjectLink href={project.sourceCodeUrl}>Source code</ExternalProjectLink>}
          {project.demoUrl && <ExternalProjectLink href={project.demoUrl}>Demo</ExternalProjectLink>}
          {project.contactEmail && <ExternalProjectLink href={`mailto:${project.contactEmail}`}>Contact project</ExternalProjectLink>}
          {project.contactPhone && <ExternalProjectLink href={`tel:${project.contactPhone}`}>Call project contact</ExternalProjectLink>}
          {project.instagramUrl && <ExternalProjectLink href={project.instagramUrl}>Instagram</ExternalProjectLink>}
        </aside>
      </div>
    </div>
  );
}

function ExternalProjectLink({ href, children }: { href: string; children: string }) {
  return (
    <Button asChild size="lg" variant="outline" className="w-full">
      <a href={href} target={href.startsWith("https:") ? "_blank" : undefined} rel={href.startsWith("https:") ? "noopener noreferrer" : undefined}>
        {children}<ExternalLinkIcon aria-hidden="true" />
      </a>
    </Button>
  );
}

function DetailValue({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value?: string;
  href?: string;
  external?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-small text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">
        {href ? <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="hover:underline">{value}</a> : value}
      </dd>
    </div>
  );
}

function formatDate(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}
