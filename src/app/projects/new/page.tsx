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
      <PageHeader title="Create Project" description="Add a project to your Tinkerers Lab dashboard." />
      <Section><ProjectForm /></Section>
    </>
  );
}
