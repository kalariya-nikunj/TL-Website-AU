import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInPanel } from "@/components/forms/SignInPanel";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in with your Ahmedabad University Google account to register for workshops.",
};

export default function LoginPage() {
  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      {/* SignInPanel reads `?next=` with useSearchParams, which opts the tree
          into client-side rendering; the boundary keeps the rest static. */}
      <Suspense fallback={<div className="h-64 w-full max-w-sm animate-pulse rounded-lg bg-primary-tint" />}>
        <SignInPanel />
      </Suspense>
    </Container>
  );
}
