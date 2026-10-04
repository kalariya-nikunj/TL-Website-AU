import "server-only";

import {
  applicationDefault,
  cert,
  getApps as getAdminApps,
  initializeApp as initializeAdminApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase.
 *
 * `import "server-only"` makes this a build error if a Client Component ever
 * imports it, rather than a silent leak of the private key into the bundle.
 *
 * The Admin SDK bypasses Firestore rules entirely — every server action must
 * authorize the verified user before accessing data here.
 */
function normalizedEnvironmentValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;

  let normalized = value.trim();
  const first = normalized[0];
  const last = normalized.at(-1);
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized || undefined;
}

function credentialsFromEnvironment() {
  const projectId = normalizedEnvironmentValue(process.env.FIREBASE_ADMIN_PROJECT_ID);
  const clientEmail = normalizedEnvironmentValue(process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  const rawPrivateKey = normalizedEnvironmentValue(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  if (!projectId || !clientEmail || !rawPrivateKey) return undefined;

  /* Vercel values may contain literal escaped line breaks or actual CRLFs. */
  const privateKey = rawPrivateKey
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!privateKey.startsWith("-----BEGIN PRIVATE KEY-----") || !privateKey.endsWith("-----END PRIVATE KEY-----")) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY must contain a valid PEM private key.");
  }

  return { projectId, clientEmail, privateKey };
}

function missingCredentials(): never {
  throw new Error(
    "Firebase Admin credentials are not configured. Set FIREBASE_ADMIN_PROJECT_ID, " +
      "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.",
  );
}

function getAdminApp(): App {
  const existing = getAdminApps();
  if (existing.length) return existing[0];

  /* Explicit service-account environment variables take priority. This is the
     supported credential source for Vercel serverless functions. */
  const serviceAccount = credentialsFromEnvironment();
  if (serviceAccount) {
    return initializeAdminApp({ credential: cert(serviceAccount), projectId: serviceAccount.projectId });
  }

  /* Vercel cannot read a local service-account file via ADC. Fail with a safe
     configuration error if its explicit credentials are missing. */
  if (process.env.VERCEL) return missingCredentials();

  /* Preserve Application Default Credentials for local development. */
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeAdminApp({ credential: applicationDefault() });
  }

  return missingCredentials();
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
