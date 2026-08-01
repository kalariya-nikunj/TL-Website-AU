import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in with your university Google account to register for workshops.",
};

export default function LoginPage() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-lg border bg-surface p-8">
        <h1 className="font-display text-h3">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Use your university Google account. Signing in is only needed to
          register for workshops and to see your registrations.
        </p>

        {/* Phase 4 wires this to Firebase Auth (Google provider). */}
        <Button className="mt-6 w-full" disabled>
          Continue with Google
        </Button>
        <p className="mt-3 text-sm text-muted">
          Sign-in is enabled in Phase 4.
        </p>
      </div>
    </Container>
  );
}
