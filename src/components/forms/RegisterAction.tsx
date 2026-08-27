"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";

import type { Registration } from "@/types";

import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelRegistration,
  getMyRegistration,
} from "@/app/actions/registrations";
import { useAuth } from "@/lib/auth/AuthProvider";

type RegisterActionProps = {
  eventSlug: string;
  eventTitle: string;
  registrationOpen: boolean;
};

/**
 * The Register control on a workshop page.
 *
 * Four states: checking, signed out, registered, and able to register. The
 * button is never a lie — someone already holding a place is offered a cancel,
 * not a form that the server would reject.
 */
export function RegisterAction({
  eventSlug,
  eventTitle,
  registrationOpen,
}: RegisterActionProps) {
  const { user, loading, getIdToken } = useAuth();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    if (!user) {
      setRegistration(null);
      setChecking(false);
      return;
    }
    const result = await getMyRegistration(await getIdToken(), eventSlug);
    setRegistration(result.ok ? result.data : null);
    setChecking(false);
  }, [user, getIdToken, eventSlug]);

  useEffect(() => {
    if (loading) return;

    /* The `cancelled` flag is not ceremony: navigating away mid-request, or
       React re-running this in Strict Mode, would otherwise resolve into an
       unmounted component and — worse — a stale response could overwrite a
       fresher one. The async wrapper also keeps setState off the synchronous
       effect path, which is what the purity rule is protecting against. */
    let cancelled = false;

    void (async () => {
      if (!user) {
        if (!cancelled) {
          setRegistration(null);
          setChecking(false);
        }
        return;
      }

      const result = await getMyRegistration(await getIdToken(), eventSlug);
      if (cancelled) return;

      setRegistration(result.ok ? result.data : null);
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, getIdToken, eventSlug]);

  if (!registrationOpen) {
    return (
      <div>
        <Button size="lg" variant="accent" className="w-full" disabled>
          Register
        </Button>
        <p className="mt-2 text-small text-muted">Registration closed.</p>
      </div>
    );
  }

  if (loading || checking) {
    return <div aria-hidden="true" className="h-11 w-full animate-pulse rounded-lg bg-primary-tint" />;
  }

  if (!user) {
    return (
      <div>
        <Button asChild size="lg" variant="accent" className="w-full">
          <Link href={`/login?next=/workshops/${eventSlug}`}>Register</Link>
        </Button>
        <p className="mt-2 text-small text-muted">
          Sign in with your university account to book a place.
        </p>
      </div>
    );
  }

  if (registration) {
    return (
      <div>
        <div className="flex items-center gap-2 rounded-lg border border-success bg-success-tint px-4 py-3 text-small font-medium text-ink">
          <CheckIcon className="size-4 shrink-0" aria-hidden="true" />
          You are registered for this session.
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelRegistration(
                await getIdToken(),
                eventSlug,
              );
              if (result.ok) {
                toast.success("Registration cancelled");
                await refresh();
              } else {
                toast.error(result.error);
              }
            })
          }
        >
          {pending ? "Cancelling…" : "Cancel my place"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        size="lg"
        variant="accent"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        Register
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Register for {eventTitle}</DialogTitle>
            <DialogDescription>
              We use these details for the attendance list and to reach you if
              the session moves.
            </DialogDescription>
          </DialogHeader>

          <RegistrationForm
            eventSlug={eventSlug}
            eventTitle={eventTitle}
            onSuccess={async () => {
              setOpen(false);
              await refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
