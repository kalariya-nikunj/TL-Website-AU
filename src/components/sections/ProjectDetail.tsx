"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { addProjectMember, getProject, removeProjectMember, searchProjectMembers } from "@/app/actions/projects";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PROJECT_CATEGORIES, type ProjectDetailData, type ProjectMemberCandidate } from "@/types/user-projects";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ProjectEquipmentUsage } from "@/components/sections/ProjectEquipmentUsage";

type ProjectDetailProps = { projectId: string };

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<ProjectDetailData | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProjectMemberCandidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [memberPending, setMemberPending] = useState("");

  const fetchProject = useCallback(async () => getProject(await getIdToken(), projectId), [getIdToken, projectId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`);
      return;
    }
    let cancelled = false;
    void fetchProject().then((result) => {
      if (cancelled) return;
      if (!result.ok) setError(result.error);
      else setView(result.data);
      setLoadingProject(false);
    });
    return () => { cancelled = true; };
  }, [fetchProject, loading, projectId, router, user]);

  async function refreshProject() {
    const result = await fetchProject();
    if (!result.ok) setError(result.error);
    else setView(result.data);
  }

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setError("");
    setNotice("");
    const result = await searchProjectMembers(await getIdToken(), projectId, search);
    setSearching(false);
    if (!result.ok) {
      setError(result.error);
      setResults(null);
    } else {
      setResults(result.data);
      if (result.data.length === 0) setNotice("No matching users found.");
    }
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

  if (loading || !user || loadingProject) {
    return <div aria-label="Loading project" className="h-48 animate-pulse rounded-lg bg-primary-tint" />;
  }
  if (!view) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4">
        <StatusMessage status="error">{error || "Project not found or you do not have access."}</StatusMessage>
        <Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  }

  const { project } = view;
  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-small font-medium text-primary">{PROJECT_CATEGORIES[project.category]}</p>
            <h2 className="mt-2 font-display text-h3 text-ink">{project.title}</h2>
            <p className="mt-2 text-small text-muted">{project.status}</p>
          </div>
          {view.viewerIsOwner && (
            <Button asChild variant="outline"><Link href={`/projects/${project.projectId}/edit`}>Edit project</Link></Button>
          )}
        </div>
        <p className="mt-6 text-body font-medium text-ink">{project.shortDescription}</p>
        <div className="mt-5 whitespace-pre-wrap text-body text-muted">{project.description}</div>

        <dl className="mt-8 grid gap-x-8 gap-y-5 border-t border-border pt-6 sm:grid-cols-2">
          <DetailValue label="Department" value={project.department} />
          <DetailValue label="Branch" value={project.branch} />
          <DetailValue label="Professor" value={project.professorName} />
          <DetailValue label="Contact email" value={project.contactEmail} href={project.contactEmail ? `mailto:${project.contactEmail}` : undefined} />
          <DetailValue label="Contact phone" value={project.contactPhone} href={project.contactPhone ? `tel:${project.contactPhone}` : undefined} />
          <DetailValue label="Instagram" value={project.instagramUrl ? "Open Instagram" : undefined} href={project.instagramUrl} external />
          <DetailValue label="Created" value={formatDate(project.createdAt)} />
          <DetailValue label="Updated" value={formatDate(project.updatedAt)} />
        </dl>
      </div>

      <ProjectEquipmentUsage projectId={project.projectId} />

      <section aria-labelledby="project-team-heading" className="mt-8 rounded-lg border border-border bg-surface p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="project-team-heading" className="font-display text-h4">Team Members</h2>
            <p className="mt-1 text-small text-muted">Project owner and team members.</p>
          </div>
        </div>
        <ul className="mt-5 divide-y divide-border">
          {view.members.map((member) => (
            <li key={member.uid} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-ink">{member.name} <span className="ml-1 text-xs font-normal text-muted">{member.role}</span></p>
                <p className="mt-1 text-small text-muted">{member.email}</p>
              </div>
              {view.viewerIsOwner && member.role !== "OWNER" && (
                <Button size="sm" variant="outline" disabled={Boolean(memberPending)} onClick={() => void removeMember(member.uid, member.name)}>
                  {memberPending === member.uid ? "Removing…" : "Remove"}
                </Button>
              )}
            </li>
          ))}
        </ul>

        {view.viewerIsOwner && (
          <form onSubmit={submitSearch} className="mt-6 border-t border-border pt-6">
            <label htmlFor="member-search" className="text-small font-medium text-ink">Add team member</label>
            <p className="mt-1 text-small text-muted">Search by name, university email, or enrollment number.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input id="member-search" minLength={2} maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search existing users" />
              <Button type="submit" variant="outline" disabled={searching || search.trim().length < 2}>
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>
            {notice && <StatusMessage status="success" className="mt-4">{notice}</StatusMessage>}
            {error && <StatusMessage status="error" className="mt-4">{error}</StatusMessage>}
            {results && results.length > 0 && (
              <ul className="mt-4 divide-y divide-border rounded-lg border border-border px-4">
                {results.map((candidate) => (
                  <li key={candidate.uid} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium text-ink">{candidate.name}</p>
                      <p className="text-small text-muted">{candidate.email}</p>
                    </div>
                    <Button type="button" size="sm" disabled={Boolean(memberPending)} onClick={() => void addMember(candidate)}>
                      {memberPending === candidate.uid ? "Adding…" : "Add"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}
        {!view.viewerIsOwner && notice && <StatusMessage status="success" className="mt-4">{notice}</StatusMessage>}
        {!view.viewerIsOwner && error && <StatusMessage status="error" className="mt-4">{error}</StatusMessage>}
      </section>
    </div>
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
