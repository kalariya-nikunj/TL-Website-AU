"use server";

import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, runAction, type ActionResult } from "@/lib/auth/verify";

const COLLECTION = "contactSubmissions";

/** Deliberately generous — these are limits against abuse, not style rules. */
const LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 3, max: 150 },
  message: { min: 10, max: 5000 },
} as const;

/** Enough to reject typos and obvious junk; full RFC validation is a fool's errand. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** One submission per address per this window. */
const THROTTLE_MS = 2 * 60 * 1000;

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/**
 * The contact form is open to people who are not signed in — a prospective
 * student asking a question is exactly who it is for. That makes it the only
 * unauthenticated write in the system, so validation here is the whole defence.
 *
 * Firestore rules deny client writes to this collection outright; the only way
 * in is through this function.
 */
export async function submitContact(
  input: ContactInput,
): Promise<ActionResult> {
  return runAction(async () => {
    const name = input.name?.trim() ?? "";
    const email = input.email?.trim().toLowerCase() ?? "";
    const subject = input.subject?.trim() ?? "";
    const message = input.message?.trim() ?? "";

    if (name.length < LIMITS.name.min || name.length > LIMITS.name.max) {
      throw new AuthError("Please enter your name.");
    }
    if (email.length > LIMITS.email.max || !EMAIL_PATTERN.test(email)) {
      throw new AuthError("Please enter a valid email address.");
    }
    if (subject.length < LIMITS.subject.min || subject.length > LIMITS.subject.max) {
      throw new AuthError("Please give your message a subject.");
    }
    if (message.length < LIMITS.message.min || message.length > LIMITS.message.max) {
      throw new AuthError(
        `Please write between ${LIMITS.message.min} and ${LIMITS.message.max} characters.`,
      );
    }

    const db = adminDb();

    /* Throttle by a single document keyed on the address, rather than querying
       submissions by (email, createdAt).
     *
     * That query would filter on one field and range on another, which
     * Firestore cannot answer without a composite index — and a missing index
     * is an outage that only shows up in production, on the one code path
     * nobody tested. A `doc(id).get()` needs no index, is O(1) forever, and
     * cannot silently start failing.
     *
     * The key is hashed so this collection never becomes a plaintext list of
     * everyone who has contacted the lab. */
    const key = createHash("sha256").update(email).digest("hex").slice(0, 32);
    const throttleRef = db.collection("contactThrottle").doc(key);
    const throttle = await throttleRef.get();
    const lastAt = throttle.exists
      ? (throttle.data()?.lastAt?.toMillis() as number | undefined)
      : undefined;

    if (lastAt && Date.now() - lastAt < THROTTLE_MS) {
      throw new AuthError(
        "We already have your message — we will reply shortly.",
      );
    }

    await db.collection(COLLECTION).add({
      name,
      email,
      subject,
      message,
      createdAt: FieldValue.serverTimestamp(),
    });

    /* Written after the submission succeeds: if the write above fails, the
       sender should be able to try again immediately rather than being locked
       out for two minutes by a message that never landed. */
    await throttleRef.set({ lastAt: FieldValue.serverTimestamp() });

    return undefined;
  });
}
