"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

type AuthButtonProps = {
  /** Desktop renders inline and compact; mobile stacks full-width in the sheet. */
  layout: "desktop" | "mobile";
  /** Lets the header close its mega panel / sheet when focus or a click lands here. */
  onInteract?: () => void;
};

/**
 * The header's account slot.
 *
 * Three states, not two — `loading` is distinct from signed-out. Firebase
 * restores a session asynchronously, so treating "no user yet" as "signed out"
 * makes the button flip from "Sign in" to the account links on every page load
 * for anyone already signed in.
 */
export function AuthButton({ layout, onInteract }: AuthButtonProps) {
  const { user, loading, signOut } = useAuth();
  const isMobile = layout === "mobile";

  if (loading) {
    /* Reserves the same space the resolved state will take, so the header does
       not reflow when auth settles. */
    return (
      <div
        aria-hidden="true"
        className={cn(
          "animate-pulse rounded-lg bg-primary-tint",
          isMobile ? "h-11 w-full" : "h-8 w-20",
        )}
      />
    );
  }

  if (!user) {
    return (
      <Button
        asChild
        size={isMobile ? "lg" : "sm"}
        className={cn(isMobile && "w-full")}
      >
        <Link href="/login" onFocus={onInteract} onClick={onInteract}>
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isMobile && "w-full flex-col items-stretch",
      )}
    >
      <Button
        asChild
        size={isMobile ? "lg" : "sm"}
        variant="outline"
        className={cn(isMobile && "w-full")}
      >
        <Link
          href="/my-registrations"
          onFocus={onInteract}
          onClick={onInteract}
        >
          {isMobile ? "My registrations" : firstName(user.displayName, user.email)}
        </Link>
      </Button>

      <Button
        type="button"
        size={isMobile ? "lg" : "sm"}
        variant="ghost"
        className={cn(isMobile && "w-full")}
        onClick={() => {
          onInteract?.();
          void signOut();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

/**
 * A first name if Google gave us one, otherwise the part of the email before
 * the @. Long names are clipped by the button, not truncated here — the full
 * value stays available to a screen reader.
 */
function firstName(
  displayName: string | null,
  email: string | null,
): string {
  if (displayName?.trim()) return displayName.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "Account";
}
