"use server";

import { FieldValue } from "firebase-admin/firestore";

import type { Registration } from "@/types";

import { getEvent } from "@/content/events";
import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireUser, runAction, type ActionResult } from "@/lib/auth/verify";

const COLLECTION = "registrations";

/**
 * One document per (event, user).
 *
 * A deterministic id makes a double submission idempotent at the database
 * level rather than relying on a read-then-write, which races when someone
 * double-clicks. Slugs and Firebase uids are both `[A-Za-z0-9_-]`, so the
 * double underscore cannot be ambiguous.
 */
function registrationId(eventSlug: string, uid: string): string {
  return `${eventSlug}__${uid}`;
}

export type RegistrationInput = {
  eventSlug: string;
  name: string;
  studentId?: string;
  department?: string;
  phone?: string;
};

export async function createRegistration(
  idToken: string | null,
  input: RegistrationInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireUser(idToken);

    /* The event is content-as-code, so this both validates the slug and stops
       a crafted request registering for something that does not exist. */
    const event = getEvent(input.eventSlug);
    if (!event) {
      throw new AuthError("That workshop no longer exists.");
    }
    if (!event.registrationOpen) {
      throw new AuthError("Registration for this workshop is closed.");
    }
    if (new Date(event.endsAt).getTime() < Date.now()) {
      throw new AuthError("That workshop has already taken place.");
    }

    const name = input.name.trim();
    if (name.length < 2 || name.length > 100) {
      throw new AuthError("Please enter your full name.");
    }

    const id = registrationId(event.slug, user.uid);
    const ref = adminDb().collection(COLLECTION).doc(id);

    if ((await ref.get()).exists) {
      throw new AuthError("You are already registered for this workshop.");
    }

    await ref.set({
      id,
      eventSlug: event.slug,
      userId: user.uid,
      name,
      /* Taken from the verified token, never from the form. A client could
         otherwise register somebody else's address. */
      email: user.email,
      ...(input.studentId?.trim() ? { studentId: input.studentId.trim() } : {}),
      ...(input.department?.trim() ? { department: input.department.trim() } : {}),
      ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });

    return { id };
  });
}

/**
 * Whether the signed-in user already holds a place on one event.
 *
 * A single `doc(id).get()` — no query, no index, constant cost. The workshop
 * page calls this on mount so the button can say "You are registered" instead
 * of offering a form that would immediately be rejected.
 */
export async function getMyRegistration(
  idToken: string | null,
  eventSlug: string,
): Promise<ActionResult<Registration | null>> {
  return runAction(async () => {
    const user = await requireUser(idToken);

    const snapshot = await adminDb()
      .collection(COLLECTION)
      .doc(registrationId(eventSlug, user.uid))
      .get();

    if (!snapshot.exists) return null;

    const data = snapshot.data()!;
    return {
      ...data,
      id: snapshot.id,
      createdAt: data.createdAt?.toDate().toISOString() ?? "",
    } as Registration;
  });
}

export async function cancelRegistration(
  idToken: string | null,
  eventSlug: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser(idToken);

    /* Ownership is structural: the id contains the uid, so a user can only ever
       address their own document. There is no way to spell someone else's. */
    await adminDb()
      .collection(COLLECTION)
      .doc(registrationId(eventSlug, user.uid))
      .delete();

    return undefined;
  });
}

/**
 * The signed-in user's registrations, newest first.
 *
 * Sorted in memory rather than with `orderBy` so this needs no composite index
 * — at a handful of registrations per student the difference is unmeasurable,
 * and a missing index is a production outage that only appears once someone
 * has enough rows to notice.
 */
export async function listMyRegistrations(
  idToken: string | null,
): Promise<ActionResult<Registration[]>> {
  return runAction(async () => {
    const user = await requireUser(idToken);

    const snapshot = await adminDb()
      .collection(COLLECTION)
      .where("userId", "==", user.uid)
      .get();

    const rows = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        /* Firestore Timestamps are not serialisable across the Server Action
           boundary — they arrive at the client as {} unless converted. */
        createdAt: data.createdAt?.toDate().toISOString() ?? "",
      } as Registration;
    });

    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}
