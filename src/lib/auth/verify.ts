import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";

import { adminAuth } from "@/lib/firebase/admin";
import { DOMAIN_REJECTION_MESSAGE, isAllowedEmail } from "@/lib/auth/policy";

/**
 * The result shape every Server Action returns.
 *
 * Actions never throw across the network boundary: an uncaught error in
 * production reaches the client as an opaque digest, which tells the user
 * nothing and tells us nothing either. A discriminated union makes the failure
 * path as typed as the success path.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export class AuthError extends Error {}

/**
 * Verify an ID token minted by the browser and confirm the account is allowed.
 *
 * This is the real gate. The Admin SDK bypasses Firestore rules entirely, so
 * anything past this point can write anywhere — which is exactly why nothing
 * gets past it without a signature Google vouches for.
 *
 * `verifyIdToken` checks the signature, expiry, issuer and audience. A forged
 * or stale token fails here.
 */
export async function requireUser(
  idToken: string | null | undefined,
): Promise<DecodedIdToken> {
  if (!idToken) {
    throw new AuthError("You need to be signed in to do that.");
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    /* Expired is the common case — tokens last an hour. The client can recover
       by calling getIdToken() again, so say something actionable. */
    throw new AuthError("Your session has expired. Please sign in again.");
  }

  if (!decoded.email_verified || !isAllowedEmail(decoded.email)) {
    throw new AuthError(DOMAIN_REJECTION_MESSAGE);
  }

  return decoded;
}

/** Wraps an action body so AuthError becomes a clean result, and nothing else leaks. */
export async function runAction<T>(
  body: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await body() };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.message };
    }
    /* Real faults are logged server-side and generalised for the client — an
       internal message could name a collection or a field. */
    console.error("[action]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
