"use server";

import { FieldValue, type DocumentData, type QueryDocumentSnapshot } from "firebase-admin/firestore";

import type {
  Project,
  ProjectCategory,
  ProjectDetailData,
  ProjectInput,
  ProjectMember,
  ProjectMemberCandidate,
  ProjectStatus,
} from "@/types/user-projects";
import { PROJECT_CATEGORIES } from "@/types/user-projects";
import { adminDb } from "@/lib/firebase/admin";
import {
  AuthError,
  requireUser,
  runAction,
  withAuthDiagnosticFirestoreRead,
  type ActionResult,
} from "@/lib/auth/verify";

const PROJECT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const CATEGORIES = Object.keys(PROJECT_CATEGORIES);
const STATUSES: readonly ProjectStatus[] = ["ACTIVE", "COMPLETED", "ARCHIVED"];

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return "";
}

function serializeProject(data: DocumentData, projectId: string): Project {
  const optional = (field: string) => typeof data[field] === "string" && data[field].trim()
    ? { [field]: data[field] as string }
    : {};
  return {
    projectId,
    title: String(data.title ?? ""),
    slug: String(data.slug ?? ""),
    category: data.category as ProjectCategory,
    shortDescription: String(data.shortDescription ?? ""),
    description: String(data.description ?? ""),
    ownerUid: String(data.ownerUid ?? ""),
    status: data.status as ProjectStatus,
    ...optional("department"),
    ...optional("branch"),
    ...optional("professorName"),
    ...optional("contactEmail"),
    ...optional("contactPhone"),
    ...optional("instagramUrl"),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function serializeMember(snapshot: QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): ProjectMember {
  const data = snapshot.data() ?? {};
  return {
    uid: String(data.uid ?? snapshot.id),
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    role: data.role === "OWNER" ? "OWNER" : "MEMBER",
    joinedAt: toIso(data.joinedAt),
  };
}

function requireProjectId(projectId: string): void {
  if (typeof projectId !== "string" || !PROJECT_ID_PATTERN.test(projectId)) {
    throw new AuthError("That project link is not valid.");
  }
}

function slugify(title: string): string {
  return title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "project";
}

function validateProjectInput(input: ProjectInput, creating: boolean) {
  if (!input || typeof input !== "object") throw new AuthError("Enter the required project details.");
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const shortDescription = typeof input?.shortDescription === "string" ? input.shortDescription.trim() : "";
  const description = typeof input?.description === "string" ? input.description.trim() : "";
  if (!title || title.length > 120) throw new AuthError("Enter a project title (up to 120 characters).");
  if (!CATEGORIES.includes(input.category)) throw new AuthError("Choose one of the available project categories.");
  if (!shortDescription || shortDescription.length > 300) throw new AuthError("Enter a short description (up to 300 characters).");
  if (!description || description.length > 10000) throw new AuthError("Enter a project description (up to 10,000 characters).");

  const status = creating ? "ACTIVE" : input.status;
  if (!STATUSES.includes(status as ProjectStatus)) throw new AuthError("Choose a valid project status.");

  const fields = {
    department: input.department,
    branch: input.branch,
    professorName: input.professorName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    instagramUrl: input.instagramUrl,
  };
  const optional: Record<string, string> = {};
  for (const [key, raw] of Object.entries(fields)) {
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length > 200) throw new AuthError(`${key} is too long.`);
    if (value) optional[key] = value;
  }
  if (optional.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(optional.contactEmail)) {
    throw new AuthError("Enter a valid contact email address.");
  }
  if (optional.instagramUrl) {
    try {
      const url = new URL(optional.instagramUrl);
      if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname)) throw new Error();
    } catch {
      throw new AuthError("Enter a valid Instagram URL beginning with https://www.instagram.com/.");
    }
  }
  return {
    title,
    slug: slugify(title),
    category: input.category,
    shortDescription,
    description,
    status: status as ProjectStatus,
    ...optional,
  };
}

async function requireCompleteProfile(uid: string) {
  const snapshot = await adminDb().collection("users").doc(uid).get();
  if (!snapshot.exists || snapshot.get("profileCompleted") !== true || snapshot.get("uid") !== uid) {
    throw new AuthError("Complete your profile before using projects.");
  }
  return snapshot.data()!;
}

async function ownedProjectRef(uid: string, projectId: string) {
  requireProjectId(projectId);
  const ref = adminDb().collection("projects").doc(projectId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.get("ownerUid") !== uid) {
    throw new AuthError("You do not have permission to manage this project.");
  }
  return ref;
}

export async function listMyProjects(
  idToken: string | null,
): Promise<ActionResult<Array<{ project: Project; isOwner: boolean }>>> {
  return runAction(async () => {
    const user = await requireUser(idToken, "PROJECTS_ACTION");
    return withAuthDiagnosticFirestoreRead("PROJECTS_ACTION", async () => {
      await requireCompleteProfile(user.uid);
      const db = adminDb();
      const [owned, memberships] = await Promise.all([
        db.collection("projects").where("ownerUid", "==", user.uid).get(),
        db.collectionGroup("members").where("uid", "==", user.uid).get(),
      ]);
      const ids = new Set<string>([
        ...owned.docs.map((doc) => doc.id),
        ...memberships.docs
          .filter((doc) => doc.id === user.uid && ["OWNER", "MEMBER"].includes(String(doc.get("role"))))
          .map((doc) => doc.ref.parent.parent?.id)
          .filter((id): id is string => Boolean(id)),
      ]);
      const rows = await Promise.all([...ids].map(async (id) => {
        const snapshot = await db.collection("projects").doc(id).get();
        if (!snapshot.exists) return null;
        const isOwner = snapshot.get("ownerUid") === user.uid;
        const isMember = memberships.docs.some((member) =>
          member.id === user.uid
          && ["OWNER", "MEMBER"].includes(String(member.get("role")))
          && member.ref.parent.parent?.id === id,
        );
        if (!isOwner && !isMember) return null;
        return { project: serializeProject(snapshot.data()!, id), isOwner };
      }));
      return rows.filter((row): row is { project: Project; isOwner: boolean } => row !== null)
        .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
    });
  });
}

export async function createProject(
  idToken: string | null,
  input: ProjectInput,
): Promise<ActionResult<Project>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    const profile = await requireCompleteProfile(user.uid);
    const fields = validateProjectInput(input, true);
    const db = adminDb();
    const projectRef = db.collection("projects").doc();
    const ownerMemberRef = projectRef.collection("members").doc(user.uid);
    const now = FieldValue.serverTimestamp();
    const data = {
      projectId: projectRef.id,
      ...fields,
      ownerUid: user.uid,
      createdAt: now,
      updatedAt: now,
    };
    await db.runTransaction(async (transaction) => {
      const currentProfile = await transaction.get(db.collection("users").doc(user.uid));
      if (!currentProfile.exists || currentProfile.get("profileCompleted") !== true) {
        throw new AuthError("Complete your profile before creating a project.");
      }
      transaction.create(projectRef, data);
      transaction.create(ownerMemberRef, {
        uid: user.uid,
        name: String(profile.name ?? ""),
        email: user.email ?? String(profile.email ?? ""),
        role: "OWNER",
        joinedAt: now,
      });
    });
    const saved = await projectRef.get();
    return serializeProject(saved.data()!, projectRef.id);
  });
}

export async function getProject(
  idToken: string | null,
  projectId: string,
): Promise<ActionResult<ProjectDetailData>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireCompleteProfile(user.uid);
    requireProjectId(projectId);
    const db = adminDb();
    const projectRef = db.collection("projects").doc(projectId);
    const snapshot = await projectRef.get();
    if (!snapshot.exists) throw new AuthError("Project not found or you do not have access.");
    const isOwner = snapshot.get("ownerUid") === user.uid;
    const viewerMembership = projectRef.collection("members").doc(user.uid);
    const membership = isOwner ? null : await viewerMembership.get();
    if (!isOwner && !membership?.exists) throw new AuthError("Project not found or you do not have access.");
    const members = await projectRef.collection("members").get();
    return {
      project: serializeProject(snapshot.data()!, projectId),
      members: members.docs.map(serializeMember).sort((a, b) => a.role === b.role ? a.name.localeCompare(b.name) : a.role === "OWNER" ? -1 : 1),
      viewerIsOwner: isOwner,
    };
  });
}

export async function updateProject(
  idToken: string | null,
  projectId: string,
  input: ProjectInput,
): Promise<ActionResult<Project>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireCompleteProfile(user.uid);
    const fields = validateProjectInput(input, false);
    requireProjectId(projectId);
    const db = adminDb();
    const ref = db.collection("projects").doc(projectId);
    const optionalFields = ["department", "branch", "professorName", "contactEmail", "contactPhone", "instagramUrl"] as const;
    const clearMissing = Object.fromEntries(
      optionalFields.filter((field) => !(field in fields)).map((field) => [field, FieldValue.delete()]),
    );
    await db.runTransaction(async (transaction) => {
      const project = await transaction.get(ref);
      if (!project.exists || project.get("ownerUid") !== user.uid) {
        throw new AuthError("You do not have permission to edit this project.");
      }
      transaction.update(ref, { ...fields, ...clearMissing, updatedAt: FieldValue.serverTimestamp() });
    });
    const saved = await ref.get();
    return serializeProject(saved.data()!, projectId);
  });
}

export async function searchProjectMembers(
  idToken: string | null,
  projectId: string,
  search: string,
): Promise<ActionResult<ProjectMemberCandidate[]>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireCompleteProfile(user.uid);
    const projectRef = await ownedProjectRef(user.uid, projectId);
    const term = typeof search === "string" ? search.trim() : "";
    if (term.length < 2 || term.length > 100) throw new AuthError("Enter at least 2 characters to search.");
    const users = adminDb().collection("users");
    const variants = [...new Set([term, term.toLowerCase(), term.toUpperCase(), term[0].toUpperCase() + term.slice(1).toLowerCase()])];
    const searches = [
      ...variants.map((value) => users.where("name", ">=", value).where("name", "<=", `${value}\uf8ff`).limit(10).get()),
      users.where("email", ">=", term.toLowerCase()).where("email", "<=", `${term.toLowerCase()}\uf8ff`).limit(10).get(),
      users.where("enrollmentNumber", ">=", term.toUpperCase()).where("enrollmentNumber", "<=", `${term.toUpperCase()}\uf8ff`).limit(10).get(),
    ];
    const snapshots = await Promise.all(searches);
    const existing = await projectRef.collection("members").get();
    const excluded = new Set([user.uid, ...existing.docs.map((doc) => doc.id)]);
    const found = new Map<string, ProjectMemberCandidate>();
    for (const snapshot of snapshots) {
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (excluded.has(doc.id) || data.profileCompleted !== true || data.uid !== doc.id) continue;
        found.set(doc.id, {
          uid: doc.id,
          name: String(data.name ?? ""),
          email: String(data.email ?? ""),
        });
      }
    }
    return [...found.values()].slice(0, 10);
  });
}

export async function addProjectMember(
  idToken: string | null,
  projectId: string,
  targetUid: string,
): Promise<ActionResult<ProjectMember>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireCompleteProfile(user.uid);
    requireProjectId(projectId);
    if (typeof targetUid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(targetUid)) {
      throw new AuthError("Choose a valid Tinkerers Lab user.");
    }
    const db = adminDb();
    const projectRef = db.collection("projects").doc(projectId);
    const memberRef = projectRef.collection("members").doc(targetUid);
    await db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      const profileRef = db.collection("users").doc(targetUid);
      const [profile, existing] = await Promise.all([
        transaction.get(profileRef),
        transaction.get(memberRef),
      ]);
      if (!project.exists || project.get("ownerUid") !== user.uid) {
        throw new AuthError("Only the project owner can add team members.");
      }
      if (targetUid === project.get("ownerUid")) throw new AuthError("The project owner is already on the team.");
      if (!profile.exists || profile.get("profileCompleted") !== true || profile.get("uid") !== targetUid) {
        throw new AuthError("That user does not have a completed Tinkerers Lab profile.");
      }
      if (existing.exists) throw new AuthError("That user is already a team member.");
      transaction.create(memberRef, {
        uid: targetUid,
        name: String(profile.get("name") ?? ""),
        email: String(profile.get("email") ?? ""),
        role: "MEMBER",
        joinedAt: FieldValue.serverTimestamp(),
      });
    });
    const added = await memberRef.get();
    return serializeMember(added);
  });
}

export async function removeProjectMember(
  idToken: string | null,
  projectId: string,
  targetUid: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireCompleteProfile(user.uid);
    requireProjectId(projectId);
    if (typeof targetUid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(targetUid)) {
      throw new AuthError("Choose a valid team member.");
    }
    const db = adminDb();
    const projectRef = db.collection("projects").doc(projectId);
    const memberRef = projectRef.collection("members").doc(targetUid);
    await db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      const member = await transaction.get(memberRef);
      if (!project.exists || project.get("ownerUid") !== user.uid) {
        throw new AuthError("Only the project owner can remove team members.");
      }
      if (targetUid === project.get("ownerUid")) throw new AuthError("The project owner cannot be removed.");
      if (!member.exists) throw new AuthError("That user is not a project member.");
      transaction.delete(memberRef);
    });
    return undefined;
  });
}
