import type { Metadata } from "next";

import { ProjectForm } from "@/components/forms/ProjectForm";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Create project",
  description: "Create a Tinkerers Lab project.",
};

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        eyebrow="Student projects"
        title="Create a project"
        description="Share the idea, people, and making behind your work in the Tinkerer Lab."
      />
      <Section>
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-end justify-between gap-6 border-b border-border pb-5">
            <div>
              <p className="eyebrow">Project submission</p>
              <h2 className="mt-2 font-display text-h3 text-primary-dark">Tell us what you built</h2>
            </div>
            <span className="hidden border border-border px-3 py-2 text-small text-muted sm:inline-flex">Ahmedabad University · Tinkerer Lab</span>
          </div>
          <ProjectForm variant="create" />
        </div>
      </Section>
    </>
  );
}
