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

export type AuthDiagnosticAction = "PROFILE_ACTION" | "PROJECTS_ACTION" | "REGISTRATIONS_ACTION";

type AuthDiagnosticStage =
  | "action_started"
  | "token_present"
  | "token_verification_started"
  | "token_verification_success"
  | "token_verification_failed"
  | "admin_auth_initialization_failed"
  | "firestore_read_started"
  | "firestore_read_success"
  | "firestore_read_failed";

function diagnosticError(error: unknown, safeMessage: string) {
  const candidate = error as { name?: unknown; code?: unknown } | null;
  const name = typeof candidate?.name === "string" && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(candidate.name)
    ? candidate.name
    : "Error";
  const code = typeof candidate?.code === "string" && /^[A-Za-z0-9_./-]{1,60}$/.test(candidate.code)
    ? candidate.code
    : "unknown";
  return { error_name: name, error_code: code, error_message: safeMessage };
}

function logAuthDiagnostic(
  action: AuthDiagnosticAction,
  stage: AuthDiagnosticStage,
  details?: Record<string, string | boolean>,
) {
  console.info("DASHBOARD_AUTH", { action, stage, ...details });
}

/** Temporary, redacted tracing for the dashboard and registrations read actions. */
export async function withAuthDiagnosticFirestoreRead<T>(
  action: AuthDiagnosticAction,
  read: () => Promise<T>,
): Promise<T> {
  logAuthDiagnostic(action, "firestore_read_started");
  try {
    const result = await read();
    logAuthDiagnostic(action, "firestore_read_success");
    return result;
  } catch (error) {
    logAuthDiagnostic(action, "firestore_read_failed", diagnosticError(error, "Firestore read failed"));
    // Keep runAction from logging the original SDK error object or its details.
    throw new Error("Firestore read failed.");
  }
}

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
  diagnosticAction?: AuthDiagnosticAction,
): Promise<DecodedIdToken> {
  if (diagnosticAction) logAuthDiagnostic(diagnosticAction, "action_started");
  if (diagnosticAction) {
    logAuthDiagnostic(diagnosticAction, "token_present", { token_present: Boolean(idToken) });
  }
  if (!idToken) {
    throw new AuthError("You need to be signed in to do that.");
  }

  let auth: ReturnType<typeof adminAuth>;
  try {
    auth = adminAuth();
  } catch (error) {
    if (diagnosticAction) {
      logAuthDiagnostic(
        diagnosticAction,
        "admin_auth_initialization_failed",
        diagnosticError(error, "Firebase Admin Auth initialization failed"),
      );
    }
    throw new AuthError("Your session has expired. Please sign in again.");
  }

  let decoded: DecodedIdToken;
  try {
    if (diagnosticAction) logAuthDiagnostic(diagnosticAction, "token_verification_started");
    decoded = await auth.verifyIdToken(idToken);
    if (diagnosticAction) logAuthDiagnostic(diagnosticAction, "token_verification_success");
  } catch (error) {
    if (diagnosticAction) {
      logAuthDiagnostic(
        diagnosticAction,
        "token_verification_failed",
        diagnosticError(error, "Firebase ID token verification failed"),
      );
    }
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
