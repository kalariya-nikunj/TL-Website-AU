"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarPlusIcon, MapPinIcon } from "lucide-react";
import { toast } from "sonner";

import type { LabEvent, Registration } from "@/types";

import { Button } from "@/components/ui/button";
import {
  cancelRegistration,
  listMyRegistrations,
} from "@/app/actions/registrations";
import { useAuth } from "@/lib/auth/AuthProvider";
import { googleCalendarUrl } from "@/lib/calendar";
import { formatEventRange } from "@/lib/format";

type MyRegistrationsProps = {
  /**
   * Every event, passed down from the server page.
   *
   * Registrations store only a slug, and events are content-as-code — so the
   * titles and dates are resolved here rather than duplicated into Firestore,
   * where they would go stale the moment a session moved.
   */
  events: LabEvent[];
  /**
   * The server's clock, as an ISO string.
   *
   * Same convention as `EventList`: deciding "finished" with `Date.now()`
   * during render is impure — it would give a different answer on every render
   * and make the server and client markup disagree.
   */
  nowIso: string;
};

export function MyRegistrations({ events, nowIso }: MyRegistrationsProps) {
  const { user, loading, getIdToken } = useAuth();
  const now = new Date(nowIso).getTime();
  const [rows, setRows] = useState<Registration[] | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const result = await listMyRegistrations(await getIdToken());
    setRows(result.ok ? result.data : []);
    if (!result.ok) toast.error(result.error);
  }, [getIdToken]);

  useEffect(() => {
    if (loading) return;

    /* Guards against a stale response landing after the user signed out, and
       keeps setState off the synchronous effect path. */
    let cancelled = false;

    void (async () => {
      if (!user) {
        if (!cancelled) setRows([]);
        return;
      }

      const result = await listMyRegistrations(await getIdToken());
      if (cancelled) return;

      setRows(result.ok ? result.data : []);
      if (!result.ok) toast.error(result.error);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, getIdToken]);

  if (loading || (user && rows === null)) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((key) => (
          <div
            key={key}
            aria-hidden="true"
            className="h-28 animate-pulse rounded-lg bg-primary-tint"
          />
        ))}
      </div>
    );
  }

  /* Signed out — the same panel the page used to render statically, now
     reached only when Firebase has confirmed there is no session. */
  if (!user) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4 rounded-lg border bg-surface p-8">
        <p className="text-muted">
          You are not signed in. Registrations are tied to your university
          Google account.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/login?next=/my-registrations">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workshops">Browse workshops</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex max-w-xl flex-col items-start gap-4 rounded-lg border bg-surface p-8">
        <p className="text-muted">
          You have not registered for anything yet.
        </p>
        <Button asChild>
          <Link href="/workshops">Browse workshops</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((registration) => {
        const event = events.find((item) => item.slug === registration.eventSlug);
        const past = event
          ? new Date(event.endsAt).getTime() < now
          : false;

        return (
          <li
            key={registration.id}
            className="rounded-lg border border-border bg-surface p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-display text-h4">
                  {event ? (
                    <Link
                      href={`/workshops/${event.slug}`}
                      className="hover-underline text-ink"
                    >
                      {event.title}
                    </Link>
                  ) : (
                    /* The event was removed from the content files after
                       someone registered. Show the record rather than
                       silently dropping it. */
                    <span className="text-ink">{registration.eventSlug}</span>
                  )}
                </h2>

                {event && (
                  <div className="mt-2 flex flex-col gap-1 text-small text-muted">
                    <span>{formatEventRange(event.startsAt, event.endsAt)}</span>
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="size-4 shrink-0" aria-hidden="true" />
                      {event.location}
                    </span>
                  </div>
                )}
              </div>

              {past && (
                <span className="rounded-lg bg-primary-tint px-2.5 py-1 text-small text-muted">
                  Finished
                </span>
              )}
            </div>

            {!past && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {event && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={googleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CalendarPlusIcon className="size-4" aria-hidden="true" />
                      Add to calendar
                    </a>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendingSlug === registration.eventSlug}
                  onClick={() =>
                    startTransition(async () => {
                      setPendingSlug(registration.eventSlug);
                      const result = await cancelRegistration(
                        await getIdToken(),
                        registration.eventSlug,
                      );
                      setPendingSlug(null);

                      if (result.ok) {
                        toast.success("Registration cancelled");
                        await refresh();
                      } else {
                        toast.error(result.error);
                      }
                    })
                  }
                >
                  {pendingSlug === registration.eventSlug
                    ? "Cancelling…"
                    : "Cancel"}
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
