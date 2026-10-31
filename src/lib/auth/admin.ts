import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";

import { AuthError, requireUser } from "@/lib/auth/verify";
import { adminDb } from "@/lib/firebase/admin";

export const ADMIN_PERMISSIONS = [
  "projects.view", "projects.create", "projects.edit", "projects.delete",
  "inventory.view", "inventory.create", "inventory.edit", "inventory.delete",
  "borrowings.view", "borrowings.manage",
  "equipment.view", "equipment.manage",
  "equipmentUsage.view", "equipmentUsage.manage",
  "admins.view", "admins.manage", "auditLogs.view",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
export type AdminRole = "admin" | "superadmin";

export type AdminActor = {
  uid: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

export async function requireAdmin(
  idToken: string | null | undefined,
  permission?: AdminPermission,
): Promise<{ token: DecodedIdToken; actor: AdminActor }> {
  const token = await requireUser(idToken);
  const snapshot = await adminDb().collection("adminUsers").doc(token.uid).get();
  if (!snapshot.exists || snapshot.get("active") !== true) {
    throw new AuthError("You do not have access to the admin panel.");
  }

  const role = snapshot.get("role");
  if (role !== "admin" && role !== "superadmin") {
    throw new AuthError("Your admin role is invalid.");
  }

  const permissions = role === "superadmin"
    ? [...ADMIN_PERMISSIONS]
    : (Array.isArray(snapshot.get("permissions"))
        ? snapshot.get("permissions").filter((value: unknown): value is AdminPermission =>
            typeof value === "string" && ADMIN_PERMISSIONS.includes(value as AdminPermission))
        : []);

  if (permission && role !== "superadmin" && !permissions.includes(permission)) {
    throw new AuthError("You do not have permission to perform this action.");
  }

  return {
    token,
    actor: { uid: token.uid, email: token.email ?? "", role, permissions },
  };
}

export async function writeAdminAudit(
  actor: AdminActor,
  action: string,
  target: string,
  targetId: string,
) {
  await adminDb().collection("adminAuditLogs").add({
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    action,
    target,
    targetId,
    createdAt: FieldValue.serverTimestamp(),
  });
}
