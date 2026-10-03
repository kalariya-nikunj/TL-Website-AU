import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/PageHeader";
import { ProfileRoute } from "@/components/sections/ProfileRoute";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Complete your profile",
  description: "Complete your Tinkerers Lab user profile.",
};

export default function OnboardingPage() {
  return (
    <>
      <PageHeader title="Complete your profile" description="Add your university details to get started." />
      <Section>
        <ProfileRoute page="onboarding" />
      </Section>
    </>
  );
}
