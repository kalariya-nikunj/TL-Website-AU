"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { toast } from "sonner";

import { getFirebaseAuth, googleProvider } from "@/lib/firebase/client";
import { DOMAIN_REJECTION_MESSAGE, isAllowedEmail } from "@/lib/auth/policy";

type AuthState = {
  user: User | null;
  /** True until Firebase has told us whether a session exists. */
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** A fresh ID token for a Server Action, or null when signed out. */
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* Firebase restores a persisted session asynchronously. Until this fires,
       we genuinely do not know if someone is signed in — rendering "Sign in"
       during that window makes the header flicker for returning users, which
       is why `loading` is a distinct state rather than `user === null`. */
    return onAuthStateChanged(getFirebaseAuth(), (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, googleProvider());

      /* `hd` only filters Google's account picker. A personal account can still
         complete the flow, so the domain is enforced here — and again in every
         Server Action, because a determined client can skip this entirely. */
      if (!isAllowedEmail(result.user.email)) {
        await firebaseSignOut(auth);
        toast.error(DOMAIN_REJECTION_MESSAGE);
        return;
      }

      toast.success(`Signed in as ${result.user.email}`);
    } catch (error) {
      /* Closing the popup is a normal thing to do, not an error worth shouting
         about. Everything else is. */
      const code = (error as { code?: string })?.code;
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      toast.error("Could not sign in. Please try again.");
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
    toast.success("Signed out");
  }, []);

  const getIdToken = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    return current ? current.getIdToken() : null;
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, getIdToken }),
    [user, loading, signIn, signOut, getIdToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
