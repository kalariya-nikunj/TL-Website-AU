import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";

export const metadata: Metadata = {
  title: "My registrations",
  description: "The workshops and events you have registered for.",
};

/**
 * Phase 4 protects this route, reads the signed-in user's `registrations`
 * documents, and renders them as EventCards with a cancel action.
 */
export default function MyRegistrationsPage() {
  return (
    <>
      <PageHeader
        title="My registrations"
        description="Everything you are signed up for, with the details you will need on the day."
      />

      <Section>
        <div className="flex max-w-xl flex-col items-start gap-4 rounded-xl border p-8">
          <p className="text-muted-foreground">
            You are not signed in. Registrations are tied to your university
            Google account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workshops">Browse workshops</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
