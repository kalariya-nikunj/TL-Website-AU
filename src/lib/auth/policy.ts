/**
 * Who is allowed to sign in.
 *
 * One place, deliberately. If students turn out to be on a subdomain
 * (`ug.ahduni.edu.in`) or the lab wants to admit an external collaborator, this
 * is the only edit — and setting it to `[]` opens sign-in to any Google account.
 */
export const ALLOWED_EMAIL_DOMAINS: readonly string[] = ["ahduni.edu.in"];

/**
 * The check that actually matters.
 *
 * The `hd` parameter we pass to Google only filters the account *picker*; it
 * cannot stop someone completing the flow with a personal account. So every
 * server action re-checks the verified email on the decoded ID token, and the
 * Firestore rules check it a third time. The client is never the authority.
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;

  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;

  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

/** Shown when a sign-in is rejected. Names the requirement, not the mechanism. */
export const DOMAIN_REJECTION_MESSAGE =
  "Please sign in with your Ahmedabad University account (@ahduni.edu.in).";
