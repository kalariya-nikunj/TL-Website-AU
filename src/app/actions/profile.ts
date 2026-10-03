"use server";

import { FieldValue } from "firebase-admin/firestore";

import type { UserProfile } from "@/types";
import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireUser, runAction, type ActionResult } from "@/lib/auth/verify";

export type ProfileInput = {
  name: string;
  enrollmentNumber: string;
  department: string;
  branch: string;
};

function asIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return "";
}

function serializeProfile(data: FirebaseFirestore.DocumentData): UserProfile {
  return {
    uid: String(data.uid ?? ""),
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    enrollmentNumber: String(data.enrollmentNumber ?? ""),
    department: String(data.department ?? ""),
    branch: String(data.branch ?? ""),
    profileCompleted: data.profileCompleted === true,
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
  };
}

export async function getMyProfile(
  idToken: string | null,
): Promise<ActionResult<UserProfile | null>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    const snapshot = await adminDb().collection("users").doc(user.uid).get();
    return snapshot.exists ? serializeProfile(snapshot.data()!) : null;
  });
}

export async function completeMyProfile(
  idToken: string | null,
  input: ProfileInput,
): Promise<ActionResult<UserProfile>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    const name = input.name?.trim() ?? "";
    const enrollmentNumber = input.enrollmentNumber?.trim().toUpperCase() ?? "";
    const department = input.department?.trim() ?? "";
    const branch = input.branch?.trim() ?? "";

    if (!name || name.length > 100) throw new AuthError("Enter your name (up to 100 characters).");
    if (!enrollmentNumber || enrollmentNumber.length > 40) throw new AuthError("Enter a valid enrollment number.");
    if (!department || department.length > 100) throw new AuthError("Enter your department (up to 100 characters).");
    if (!branch || branch.length > 100) throw new AuthError("Enter your branch (up to 100 characters).");
    if (!user.email) throw new AuthError("Your account does not have an email address.");

    const db = adminDb();
    const ref = db.collection("users").doc(user.uid);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists && snapshot.get("profileCompleted") === true) return;

      const profile = {
        uid: user.uid,
        name,
        email: user.email!,
        enrollmentNumber,
        department,
        branch,
        profileCompleted: true,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (snapshot.exists) {
        transaction.update(ref, profile);
      } else {
        transaction.create(ref, { ...profile, createdAt: FieldValue.serverTimestamp() });
      }
    });

    const saved = await ref.get();
    if (!saved.exists) throw new Error("Profile write did not produce a document.");
    return serializeProfile(saved.data()!);
  });
}
