import type { Metadata } from "next";

import { PageHeader } from "@/components/sections/PageHeader";
import { ProfileRoute } from "@/components/sections/ProfileRoute";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Tinkerers Lab profile and projects.",
};

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Your profile" description="Your Tinkerers Lab account and profile." />
      <Section>
        <ProfileRoute page="profile" />
      </Section>
    </>
  );
}
