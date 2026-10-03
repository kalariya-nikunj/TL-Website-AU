import type { Metadata } from "next";

import { ProjectForm } from "@/components/forms/ProjectForm";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Edit project",
  description: "Edit your Tinkerers Lab project.",
};

export default async function EditProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <>
      <PageHeader title="Edit project" description="Update project information and status." />
      <Section><ProjectForm projectId={projectId} /></Section>
    </>
  );
}
