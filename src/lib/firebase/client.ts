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
// These are public browser-client identifiers, not credentials. They are embedded in the client bundle by design.
// The fallback keeps production working if Vercel is missing the matching NEXT_PUBLIC_* build variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWP5DVcgRxcyVZ-jBIkCx7SOjfS5Z0z1o",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tinkerers-lab-39e6a.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tinkerers-lab-39e6a",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tinkerers-lab-39e6a.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "905124583429",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:905124583429:web:76c4b817fed2880e98246c",
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
