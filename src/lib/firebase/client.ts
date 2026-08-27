import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

/**
 * Browser-side Firebase.
 *
 * Every value here is a `NEXT_PUBLIC_` variable and is compiled into the
 * JavaScript we serve. That is by design: these identify the project, they do
 * not authorise anything. All access control lives in `firestore.rules`.
 * Never put an admin credential in this file.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * `getApps()` is checked because Next's dev server re-executes modules on every
 * hot reload; calling `initializeApp` twice throws.
 */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

/**
 * `hd` asks Google to show only Ahmedabad University accounts in the picker.
 * It is a *hint*, not a control — a determined user can still authenticate with
 * a personal account, which is why the domain is checked again server-side in
 * `src/lib/auth/policy.ts` before anything is written.
 */
export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ hd: "ahduni.edu.in", prompt: "select_account" });
  return provider;
}
