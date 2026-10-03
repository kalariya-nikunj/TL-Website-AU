"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * The sign-in card.
 *
 * Supports `?next=` so that "Register" on a workshop can send someone here and
 * land them back on the workshop afterwards, rather than dumping them on a
 * generic page having forgotten what they were doing.
 */
export function SignInPanel() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  /* Only same-origin paths are honoured. Accepting an arbitrary `next` would
     make this an open redirect: a link to our domain that quietly forwards to
     somebody else's, which is a phishing primitive. */
  const raw = params.get("next");
  const next = raw && raw.startsWith("/") && !raw.startsWith("//")
    ? raw
    : "/dashboard";

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  return (
    <div className="w-full max-w-sm rounded-lg border bg-surface p-8">
      <h1 className="font-display text-h3">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Use your Ahmedabad University Google account. Signing in is only needed
        to register for workshops and to see your registrations.
      </p>

      <Button
        className="mt-6 w-full"
        disabled={loading || Boolean(user)}
        onClick={() => void signIn()}
      >
        {loading ? "Checking…" : user ? "Signed in" : "Continue with Google"}
      </Button>

      <p className="mt-3 text-sm text-muted">
        Only <span className="font-medium text-ink">@ahduni.edu.in</span>{" "}
        accounts can register.
      </p>
    </div>
  );
}
