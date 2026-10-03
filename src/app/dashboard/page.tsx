import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/PageHeader";
import { ProfileRoute } from "@/components/sections/ProfileRoute";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Tinkerers Lab profile dashboard.",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your Tinkerers Lab account and profile." />
      <Section>
        <ProfileRoute page="dashboard" />
      </Section>
    </>
  );
}
