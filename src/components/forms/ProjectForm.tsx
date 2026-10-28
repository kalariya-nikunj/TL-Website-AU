"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createProject, getProject, updateProject } from "@/app/actions/projects";
import { StatusMessage } from "@/components/feedback/StatusMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/AuthProvider";
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectInput, type ProjectStatus } from "@/types/user-projects";

type ProjectFormProps = { projectId?: string; variant?: "create" | "edit" };
type FormState = Omit<ProjectInput, "category" | "status" | "images" | "facilitiesUsed" | "materials" | "tags" | "externalTeam"> & {
  imagesText: string;
  facilitiesUsedText: string;
  materialsText: string;
  tagsText: string;
  externalTeamText: string;
};
type LoadState = "loading" | "ready" | "error";

const EMPTY_FORM: FormState = {
  title: "",
  shortDescription: "",
  description: "",
  department: "",
  branch: "",
  professorName: "",
  contactEmail: "",
  contactPhone: "",
  instagramUrl: "",
  imagesText: "",
  facilitiesUsedText: "",
  materialsText: "",
  tagsText: "",
  externalTeamText: "",
  award: "",
  duration: "",
  sourceCodeUrl: "",
  demoUrl: "",
};

export function ProjectForm({ projectId, variant = "edit" }: ProjectFormProps) {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [category, setCategory] = useState<ProjectCategory>("DIM");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [loadState, setLoadState] = useState<LoadState>(projectId ? "loading" : "ready");
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(projectId ? `/projects/${projectId}/edit` : "/projects/new")}`);
      return;
    }
    if (!projectId) return;

    let cancelled = false;
    void (async () => {
      const result = await getProject(await getIdToken(), projectId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoadState("error");
        return;
      }
      setIsOwner(result.data.viewerIsOwner);
      setForm({
        title: result.data.project.title,
        shortDescription: result.data.project.shortDescription,
        description: result.data.project.description,
        department: result.data.project.department ?? "",
        branch: result.data.project.branch ?? "",
        professorName: result.data.project.professorName ?? "",
        contactEmail: result.data.project.contactEmail ?? "",
        contactPhone: result.data.project.contactPhone ?? "",
        instagramUrl: result.data.project.instagramUrl ?? "",
        imagesText: (result.data.project.images ?? []).join("\n"),
        facilitiesUsedText: (result.data.project.facilitiesUsed ?? []).join("\n"),
        materialsText: (result.data.project.materials ?? []).join("\n"),
        tagsText: (result.data.project.tags ?? []).join("\n"),
        externalTeamText: (result.data.project.externalTeam ?? []).join("\n"),
        award: result.data.project.award ?? "",
        duration: result.data.project.duration ?? "",
        sourceCodeUrl: result.data.project.sourceCodeUrl ?? "",
        demoUrl: result.data.project.demoUrl ?? "",
      });
      setCategory(result.data.project.category);
      setStatus(result.data.project.status);
      setLoadState("ready");
    })();
    return () => { cancelled = true; };
  }, [getIdToken, loading, projectId, router, user]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const lines = (value: string) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    const { imagesText, facilitiesUsedText, materialsText, tagsText, externalTeamText, ...fields } = form;
    const input: ProjectInput = {
      ...fields,
      images: lines(imagesText),
      facilitiesUsed: lines(facilitiesUsedText),
      materials: lines(materialsText),
      tags: lines(tagsText),
      externalTeam: lines(externalTeamText),
      category,
      status: projectId ? status : "ACTIVE",
    };
    startTransition(async () => {
      const token = await getIdToken();
      const result = projectId
        ? await updateProject(token, projectId, input)
        : await createProject(token, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(`/projects/${result.data.projectId}`);
    });
  }

  if (loading || !user || (projectId && loadState === "loading")) {
    return <div aria-label="Loading project form" className="h-40 max-w-3xl animate-pulse rounded-lg bg-primary-tint" />;
  }

  if (projectId && loadState === "error") {
    return <StatusMessage status="error">{error}</StatusMessage>;
  }

  if (projectId && !isOwner) {
    return <StatusMessage status="error">Only the project owner can edit project information.</StatusMessage>;
  }

  return (
    <form onSubmit={submit} className={`flex flex-col gap-5 border border-border bg-surface shadow-sm ${variant === "create" ? "max-w-none border-t-4 border-t-accent p-6 md:p-10" : "max-w-3xl rounded-lg p-6 md:p-8"}`}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-title">Project title</Label>
        <Input id="project-title" required maxLength={120} value={form.title} onChange={(event) => updateField("title", event.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="project-category">Category</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as ProjectCategory)}>
            <SelectTrigger id="project-category" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_CATEGORIES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {projectId && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger id="project-status" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-short-description">Short description</Label>
        <Textarea id="project-short-description" required maxLength={300} rows={3} value={form.shortDescription} onChange={(event) => updateField("shortDescription", event.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea id="project-description" required maxLength={10000} rows={7} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Department" id="project-department" value={form.department ?? ""} onChange={(value) => updateField("department", value)} />
        <Field label="Branch" id="project-branch" value={form.branch ?? ""} onChange={(value) => updateField("branch", value)} />
        <Field label="Professor" id="project-professor" value={form.professorName ?? ""} onChange={(value) => updateField("professorName", value)} />
        <Field label="Contact email" id="project-contact-email" type="email" value={form.contactEmail ?? ""} onChange={(value) => updateField("contactEmail", value)} />
        <Field label="Contact phone" id="project-contact-phone" type="tel" value={form.contactPhone ?? ""} onChange={(value) => updateField("contactPhone", value)} />
        <Field label="Instagram URL" id="project-instagram" type="url" placeholder="https://www.instagram.com/…" value={form.instagramUrl ?? ""} onChange={(value) => updateField("instagramUrl", value)} />
      </div>

      <section className="mt-2 border-t border-border pt-6" aria-labelledby="project-portfolio-details">
        <p className="eyebrow">Portfolio details</p>
        <h2 id="project-portfolio-details" className="mt-2 font-display text-h4 text-primary-dark">Show how your project came together</h2>
        <p className="mt-2 text-small text-muted">Optional. Add one item per line. These details appear on your project page.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Award" id="project-award" value={form.award ?? ""} onChange={(value) => updateField("award", value)} />
          <Field label="Duration" id="project-duration" placeholder="e.g. Two semesters" value={form.duration ?? ""} onChange={(value) => updateField("duration", value)} />
          <Field label="Source code URL" id="project-source-code" type="url" value={form.sourceCodeUrl ?? ""} onChange={(value) => updateField("sourceCodeUrl", value)} />
          <Field label="Demo URL" id="project-demo" type="url" value={form.demoUrl ?? ""} onChange={(value) => updateField("demoUrl", value)} />
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <ListField label="Project image paths" id="project-images" value={form.imagesText} onChange={(value) => updateField("imagesText", value)} placeholder="/images/projects/my-project.jpg" />
          <ListField label="How it was made · equipment or facilities" id="project-facilities" value={form.facilitiesUsedText} onChange={(value) => updateField("facilitiesUsedText", value)} placeholder="CNC Router" />
          <ListField label="Materials" id="project-materials" value={form.materialsText} onChange={(value) => updateField("materialsText", value)} placeholder="6 mm aluminium plate" />
          <ListField label="Tags" id="project-tags" value={form.tagsText} onChange={(value) => updateField("tagsText", value)} placeholder="Robotics" />
          <ListField label="External contributors" id="project-external-team" value={form.externalTeamText} onChange={(value) => updateField("externalTeamText", value)} placeholder="Contributor name and credit" />
        </div>
      </section>

      <p className="text-small text-muted">Project ownership is assigned to your signed-in account.</p>
      {error && <StatusMessage status="error">{error}</StatusMessage>}
      <Button type="submit" disabled={pending}>
        {pending ? (projectId ? "Saving changes…" : "Creating project…") : (projectId ? "Save changes" : "Create Project")}
      </Button>
    </form>
  );
}

function Field({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label} <span className="font-normal text-muted">(optional)</span></Label>
      <Input id={id} type={type} placeholder={placeholder} maxLength={200} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ListField({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label} <span className="font-normal text-muted">(optional)</span></Label>
      <Textarea id={id} rows={3} maxLength={2000} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}
