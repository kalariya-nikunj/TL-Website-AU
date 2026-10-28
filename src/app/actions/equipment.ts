"use server";

import { FieldValue, type DocumentData } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import { AuthError, requireUser, runAction, type ActionResult } from "@/lib/auth/verify";
import { retryPendingEquipmentUsageSheetSync, syncEquipmentUsageToGoogleSheets } from "@/lib/equipment/usage-sheet-sync";
import type { Equipment, EquipmentProjectOption, EquipmentUsage, EquipmentStatus, EquipmentUsageStatus } from "@/types/equipment";
import masterRecords from "../../../scripts/equipment-master.json";

type MasterEquipment = Omit<Equipment, "status" | "isActive"> & { currentStatus: string };
const EQUIPMENT_MASTER = masterRecords as MasterEquipment[];

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function toIso(value: unknown): string {
  return value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate().toISOString()
    : "";
}

function serializeEquipment(data: DocumentData, equipmentId: string): Equipment {
  return {
    equipmentId,
    ...(typeof data.srNo === "number" ? { srNo: data.srNo } : {}),
    name: String(data.name ?? ""),
    ...(typeof data.manufacturer === "string" && data.manufacturer ? { manufacturer: data.manufacturer } : {}),
    ...(typeof data.model === "string" && data.model ? { model: data.model } : {}),
    ...(typeof data.type === "string" && data.type ? { type: data.type } : {}),
    ...(typeof data.detailsUrl === "string" && data.detailsUrl ? { detailsUrl: data.detailsUrl } : {}),
    ...(typeof data.quantity === "number" ? { quantity: data.quantity } : {}),
    ...(typeof data.description === "string" ? { description: data.description } : {}),
    ...(typeof data.maintenancePartner === "string" && data.maintenancePartner ? { maintenancePartner: data.maintenancePartner } : {}),
    ...(typeof data.contact === "string" && data.contact ? { contact: data.contact } : {}),
    ...(typeof data.currentStatus === "string" ? { currentStatus: data.currentStatus } : {}),
    status: data.status as EquipmentStatus,
    isActive: data.isActive === true,
    ...(typeof data.activeUsageId === "string" ? { activeUsageId: data.activeUsageId } : {}),
    ...(typeof data.lastUsageId === "string" ? { lastUsageId: data.lastUsageId } : {}),
    usageCount: typeof data.usageCount === "number" ? data.usageCount : 0,
  };
}

function sourceRuntimeStatus(currentStatus: string): EquipmentStatus {
  return isSourceOutOfWork(currentStatus) ? "MAINTENANCE" : "AVAILABLE";
}

function serializeMasterEquipment(record: MasterEquipment): Equipment {
  return { ...record, status: sourceRuntimeStatus(record.currentStatus), isActive: true };
}

function isSourceOutOfWork(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "out of work";
}

function serializeUsage(data: DocumentData, usageId: string): EquipmentUsage {
  return {
    usageId,
    equipmentId: String(data.equipmentId ?? ""),
    equipmentName: String(data.equipmentName ?? ""),
    userUid: String(data.userUid ?? ""),
    userName: String(data.userName ?? ""),
    projectId: String(data.projectId ?? ""),
    projectTitle: String(data.projectTitle ?? ""),
    status: data.status as EquipmentUsageStatus,
    startedAt: toIso(data.startedAt),
    ...(data.endedAt ? { endedAt: toIso(data.endedAt) } : {}),
    ...(typeof data.usageNumber === "number" ? { usageNumber: data.usageNumber } : {}),
  };
}

function validateId(value: string, label: string): void {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) throw new AuthError(`That ${label} link is not valid.`);
}

async function requireProfile(uid: string): Promise<DocumentData> {
  const snapshot = await adminDb().collection("users").doc(uid).get();
  if (!snapshot.exists || snapshot.get("profileCompleted") !== true || snapshot.get("uid") !== uid) {
    throw new AuthError("Complete your profile before using equipment.");
  }
  return snapshot.data()!;
}

async function releaseLegacyUsageLock(db: ReturnType<typeof adminDb>, equipmentId: string): Promise<void> {
  const equipmentRef = db.collection("equipment").doc(equipmentId);
  let releasedUsageId = "";
  await db.runTransaction(async (transaction) => {
    const equipment = await transaction.get(equipmentRef);
    if (!equipment.exists || equipment.get("status") !== "IN_USE") return;

    const activeUsageId = equipment.get("activeUsageId");
    const usageId = typeof activeUsageId === "string" ? activeUsageId : "";
    const usageRef = usageId ? db.collection("equipmentUsage").doc(usageId) : null;
    const usage = usageRef ? await transaction.get(usageRef) : null;
    const now = FieldValue.serverTimestamp();

    if (usage?.exists && usage.get("status") === "ACTIVE") {
      transaction.update(usageRef!, {
        status: "RECORDED",
        endReason: "LEGACY_LOCK_RELEASED_WITHOUT_END_TIME",
        updatedAt: now,
      });
      transaction.set(db.collection("equipmentUsageSheetOutbox").doc(usageId), {
        status: "PENDING",
        version: FieldValue.increment(1),
        updatedAt: now,
      }, { merge: true });
      releasedUsageId = usageId;
    }

    const nextStatus = equipment.get("isActive") !== true
      ? "DISABLED"
      : isSourceOutOfWork(equipment.get("currentStatus")) ? "MAINTENANCE" : "AVAILABLE";
    transaction.update(equipmentRef, {
      status: nextStatus,
      activeUsageId: FieldValue.delete(),
      ...(usage?.exists ? { lastUsageId: usageId } : {}),
      updatedAt: now,
    });
  });
  if (releasedUsageId) await syncEquipmentUsageToGoogleSheets(releasedUsageId, db);
  await retryPendingEquipmentUsageSheetSync(db, releasedUsageId);
}

async function listAccessibleProjects(uid: string): Promise<EquipmentProjectOption[]> {
  const db = adminDb();
  const [owned, memberships] = await Promise.all([
    db.collection("projects").where("ownerUid", "==", uid).get(),
    db.collectionGroup("members").where("uid", "==", uid).get(),
  ]);
  const ids = new Set([
    ...owned.docs.map((doc) => doc.id),
    ...memberships.docs
      .filter((doc) => doc.id === uid && ["OWNER", "MEMBER"].includes(String(doc.get("role"))))
      .map((doc) => doc.ref.parent.parent?.id)
      .filter((id): id is string => Boolean(id)),
  ]);
  const projects = await Promise.all([...ids].map(async (id) => {
    const snapshot = await db.collection("projects").doc(id).get();
    if (!snapshot.exists) return null;
    const hasMembership = memberships.docs.some((doc) =>
      doc.id === uid && doc.ref.parent.parent?.id === id && ["OWNER", "MEMBER"].includes(String(doc.get("role"))),
    );
    if (snapshot.get("ownerUid") !== uid && !hasMembership) return null;
    return { projectId: id, title: String(snapshot.get("title") ?? "") };
  }));
  return projects.filter((project): project is EquipmentProjectOption => Boolean(project))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getEquipmentPage(
  idToken: string | null,
  equipmentId: string,
): Promise<ActionResult<{ equipment: Equipment; projects: EquipmentProjectOption[]; latestUsage: EquipmentUsage | null; seeded: boolean }>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireProfile(user.uid);
    validateId(equipmentId, "equipment");
    const db = adminDb();
    await releaseLegacyUsageLock(db, equipmentId);
    const equipmentSnapshot = await db.collection("equipment").doc(equipmentId).get();
    const masterRecord = EQUIPMENT_MASTER.find((record) => record.equipmentId === equipmentId);
    if (!equipmentSnapshot.exists && !masterRecord) throw new AuthError("Equipment not found.");
    const equipment = equipmentSnapshot.exists
      ? serializeEquipment(equipmentSnapshot.data()!, equipmentId)
      : serializeMasterEquipment(masterRecord!);
    const seeded = equipmentSnapshot.exists;
    const projects = await listAccessibleProjects(user.uid);
    const lastUsageId = typeof equipmentSnapshot.get("lastUsageId") === "string"
      ? equipmentSnapshot.get("lastUsageId")
      : equipmentSnapshot.get("activeUsageId");
    let latestUsage: EquipmentUsage | null = null;
    if (seeded && typeof lastUsageId === "string") {
      const usageSnapshot = await db.collection("equipmentUsage").doc(lastUsageId).get();
      if (usageSnapshot.exists) {
        const usageData = usageSnapshot.data()!;
        const sameProject = projects.some((project) => project.projectId === usageData.projectId);
        if (sameProject || usageData.userUid === user.uid) {
          latestUsage = serializeUsage(usageData, usageSnapshot.id);
        }
      }
    }
    return { equipment, projects, latestUsage, seeded };
  });
}

export async function listEquipment(
  idToken: string | null,
): Promise<ActionResult<Equipment[]>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    await requireProfile(user.uid);
    const db = adminDb();
    const initialSnapshot = await db.collection("equipment").get();
    await Promise.all(initialSnapshot.docs
      .filter((document) => document.get("status") === "IN_USE")
      .map((document) => releaseLegacyUsageLock(db, document.id)));
    const snapshot = await db.collection("equipment").get();
    const persisted = new Map(snapshot.docs.map((document) => [document.id, document.data()]));
    return EQUIPMENT_MASTER
      .map((record) => persisted.has(record.equipmentId)
        ? serializeEquipment(persisted.get(record.equipmentId)!, record.equipmentId)
        : serializeMasterEquipment(record))
      .filter((equipment) => equipment.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function startEquipmentUsage(
  idToken: string | null,
  equipmentId: string,
  projectId: string,
): Promise<ActionResult<EquipmentUsage>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    const profile = await requireProfile(user.uid);
    validateId(equipmentId, "equipment");
    validateId(projectId, "project");
    const db = adminDb();
    const equipmentRef = db.collection("equipment").doc(equipmentId);
    const projectRef = db.collection("projects").doc(projectId);
    const memberRef = projectRef.collection("members").doc(user.uid);
    const usageRef = db.collection("equipmentUsage").doc();
    const sheetOutboxRef = db.collection("equipmentUsageSheetOutbox").doc(usageRef.id);
    let legacyUsageIdToSync = "";

    await db.runTransaction(async (transaction) => {
      const [equipment, project, member] = await Promise.all([
        transaction.get(equipmentRef),
        transaction.get(projectRef),
        transaction.get(memberRef),
      ]);
      if (!project.exists || (project.get("ownerUid") !== user.uid && (
        !member.exists || member.get("uid") !== user.uid || !["OWNER", "MEMBER"].includes(String(member.get("role")))
      ))) {
        throw new AuthError("You do not have permission to use this project.");
      }
      if (!equipment.exists) throw new AuthError("Equipment not found.");
      if (equipment.get("isActive") !== true || isSourceOutOfWork(equipment.get("currentStatus"))
        || equipment.get("status") === "MAINTENANCE" || equipment.get("status") === "DISABLED") {
        throw new AuthError("This equipment is currently unavailable.");
      }
      if (equipment.get("status") !== "AVAILABLE" && equipment.get("status") !== "IN_USE") {
        throw new AuthError("This equipment is currently unavailable.");
      }

      const legacyUsageId = equipment.get("status") === "IN_USE" && typeof equipment.get("activeUsageId") === "string"
        ? String(equipment.get("activeUsageId"))
        : "";
      legacyUsageIdToSync = legacyUsageId;
      const legacyUsageRef = legacyUsageId ? db.collection("equipmentUsage").doc(legacyUsageId) : null;
      const legacyUsage = legacyUsageRef ? await transaction.get(legacyUsageRef) : null;
      let priorUsageCount = typeof equipment.get("usageCount") === "number"
        ? Number(equipment.get("usageCount"))
        : 0;
      if (typeof equipment.get("usageCount") !== "number") {
        const priorUsage = await transaction.get(db.collection("equipmentUsage").where("equipmentId", "==", equipmentId));
        priorUsageCount = priorUsage.size;
      }
      const nextUsageCount = priorUsageCount + 1;

      const now = FieldValue.serverTimestamp();
      transaction.create(usageRef, {
        usageId: usageRef.id,
        equipmentId,
        equipmentName: String(equipment.get("name") ?? ""),
        userUid: user.uid,
        userName: String(profile.name ?? ""),
        projectId,
        projectTitle: String(project.get("title") ?? ""),
        status: "RECORDED",
        startedAt: now,
        usageNumber: nextUsageCount,
        createdAt: now,
        updatedAt: now,
      });
      transaction.create(sheetOutboxRef, { status: "PENDING", version: 1, attempts: 0, updatedAt: now });
      if (legacyUsageRef && legacyUsage?.exists && legacyUsage.get("status") === "ACTIVE") {
        transaction.update(legacyUsageRef, {
          status: "RECORDED",
          endReason: "LEGACY_LOCK_RELEASED_WITHOUT_END_TIME",
          updatedAt: now,
        });
        transaction.set(db.collection("equipmentUsageSheetOutbox").doc(legacyUsageId), {
          status: "PENDING",
          version: FieldValue.increment(1),
          updatedAt: now,
        }, { merge: true });
      }
      transaction.update(equipmentRef, {
        status: equipment.get("status") === "IN_USE"
          ? (isSourceOutOfWork(equipment.get("currentStatus")) ? "MAINTENANCE" : "AVAILABLE")
          : equipment.get("status"),
        activeUsageId: FieldValue.delete(),
        lastUsageId: usageRef.id,
        usageCount: nextUsageCount,
        updatedAt: now,
      });
    });

    if (legacyUsageIdToSync) await syncEquipmentUsageToGoogleSheets(legacyUsageIdToSync, db);
    await syncEquipmentUsageToGoogleSheets(usageRef.id, db);
    await retryPendingEquipmentUsageSheetSync(db, usageRef.id);
    const saved = await usageRef.get();
    return serializeUsage(saved.data()!, usageRef.id);
  });
}

export async function endEquipmentUsage(
  idToken: string | null,
  usageId: string,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    validateId(usageId, "usage session");
    const db = adminDb();
    const usageRef = db.collection("equipmentUsage").doc(usageId);
    const sheetOutboxRef = db.collection("equipmentUsageSheetOutbox").doc(usageId);

    await db.runTransaction(async (transaction) => {
      const usage = await transaction.get(usageRef);
      if (!usage.exists) throw new AuthError("This usage session could not be found.");
      if (usage.get("userUid") !== user.uid) throw new AuthError("You do not have permission to end this usage session.");
      if (usage.get("status") !== "ACTIVE") throw new AuthError("This usage session has already ended.");

      const equipmentId = String(usage.get("equipmentId") ?? "");
      validateId(equipmentId, "equipment");
      const equipmentRef = db.collection("equipment").doc(equipmentId);
      const equipment = await transaction.get(equipmentRef);
      if (!equipment.exists || equipment.get("activeUsageId") !== usageId || equipment.get("status") !== "IN_USE") {
        throw new AuthError("This usage session is no longer active.");
      }

      const now = FieldValue.serverTimestamp();
      const nextEquipmentStatus = isSourceOutOfWork(equipment.get("currentStatus")) ? "MAINTENANCE" : "AVAILABLE";
      transaction.update(usageRef, {
        status: "COMPLETED",
        endedAt: now,
        endedByUid: user.uid,
        endedByEmail: user.email ?? "",
        endReason: "STUDENT_ENDED",
        updatedAt: now,
      });
      transaction.set(sheetOutboxRef, { status: "PENDING", version: FieldValue.increment(1), updatedAt: now }, { merge: true });
      transaction.update(equipmentRef, {
        status: nextEquipmentStatus,
        activeUsageId: FieldValue.delete(),
        updatedAt: now,
      });
    });
    await syncEquipmentUsageToGoogleSheets(usageId, db);
    await retryPendingEquipmentUsageSheetSync(db, usageId);
    return undefined;
  });
}
