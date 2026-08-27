import "server-only";

import {
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
 * The Admin SDK bypasses Firestore rules entirely — it is the root account for
 * this database. Every server action must therefore do its own authorisation
 * before touching anything here; the rules are the *second* line of defence,
 * not the first.
 */
function credentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  /* The key is stored with literal "\n" sequences because dotenv cannot hold
     real newlines; they have to be turned back into line breaks or the PEM
     parser rejects it. This is the single most common Firebase Admin setup
     failure, and its error message ("Invalid PEM formatted message") does not
     hint at the cause. */
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, " +
        "FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.",
    );
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminApp(): App {
  const existing = getAdminApps();
  if (existing.length) return existing[0];

  return initializeAdminApp({ credential: cert(credentials()) });
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
