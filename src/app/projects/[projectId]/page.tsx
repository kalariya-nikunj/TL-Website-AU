import type { Metadata } from "next";

import { ProjectDetail } from "@/components/sections/ProjectDetail";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Project",
  description: "Tinkerers Lab project details.",
};

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <>
      <PageHeader title="Project details" description="Project overview and team." />
      <Section><ProjectDetail projectId={projectId} /></Section>
    </>
  );
}
