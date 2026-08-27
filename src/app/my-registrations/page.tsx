import type { Metadata } from "next";

import { MyRegistrations } from "@/components/sections/MyRegistrations";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { getAllEvents } from "@/content/events";

export const metadata: Metadata = {
  title: "My registrations",
  description: "The workshops and events you have registered for.",
};

/**
 * Route protection is done in the client component rather than with middleware.
 *
 * Firebase keeps its session in the browser, so the server has no way to know
 * who this is without a session cookie — and adding one buys nothing here,
 * because the page renders no private data itself. The registrations arrive
 * from a Server Action that verifies an ID token, so an unauthenticated visitor
 * reaching this URL simply sees the sign-in prompt and no data.
 */
export default function MyRegistrationsPage() {
  return (
    <>
      <PageHeader
        title="My registrations"
        description="Everything you are signed up for, with the details you will need on the day."
      />

      <Section>
        <MyRegistrations
          events={getAllEvents()}
          nowIso={new Date().toISOString()}
        />
      </Section>
    </>
  );
}
