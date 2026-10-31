"use server";

import { requireAdmin, type AdminPermission } from "@/lib/auth/admin";
import { AuthError, runAction, type ActionResult } from "@/lib/auth/verify";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { writeAdminAudit } from "@/lib/auth/admin";
import { adminAuth } from "@/lib/firebase/admin";
import { getInventoryCatalog } from "@/lib/catalog/live";
import { getEquipmentMaster } from "@/lib/catalog/live";
import { updateMachinerySourceRow } from "@/lib/catalog/admin-writes";
import { createInventoryCatalogRow, updateInventoryCatalogRow } from "@/lib/catalog/admin-writes";
import { updateTag } from "next/cache";
import { syncInventorySheetsRecord } from "@/lib/inventory/sheets-sync";
import type { InventoryItem } from "@/types/inventory";
import { returnInventoryItem } from "@/app/actions/inventory";
import { endEquipmentUsage } from "@/app/actions/equipment";
import { syncEquipmentUsageToGoogleSheets } from "@/lib/equipment/usage-sheet-sync";
import type { ProjectCategory } from "@/types/user-projects";

const MODULES = ["projects", "inventoryItems", "inventoryLoans", "equipment", "equipmentUsage", "adminUsers", "adminAuditLogs"] as const;
const RECORD_MODULES = {
  projects: { collection: "projects", permission: "projects.view" },
  inventory: { collection: "inventoryItems", permission: "inventory.view" },
  borrowings: { collection: "inventoryLoans", permission: "borrowings.view" },
  equipment: { collection: "equipment", permission: "equipment.view" },
  equipmentUsage: { collection: "equipmentUsage", permission: "equipmentUsage.view" },
  auditLogs: { collection: "adminAuditLogs", permission: "auditLogs.view" },
  admins: { collection: "adminUsers", permission: "admins.view" },
} as const satisfies Record<string, { collection: string; permission: AdminPermission }>;

export async function checkMySuperadminAccess(idToken: string | null): Promise<ActionResult<boolean>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken);
    return actor.role === "superadmin";
  });
}

function inventoryFingerprint(source: InventoryItem): string {
  return JSON.stringify([source.name,source.category,source.description,source.sourceSheet,source.sourceRow,source.sourceReference,source.detailsUrl,source.totalQuantity,source.availableQuantity,source.borrowable,source.stockNeedsReview,source.sourceStatus]);
}

export async function getAdminRecords(
  idToken: string | null,
  module: keyof typeof RECORD_MODULES,
): Promise<ActionResult<Array<Record<string, unknown>>>> {
  return runAction(async () => {
    if (!idToken) throw new AuthError("Sign in to access administration.");
    const config = RECORD_MODULES[module];
    if (!config) throw new AuthError("That admin section is not available.");
    await requireAdmin(idToken, config.permission);
    if (module === "inventory") {
      const items = await getInventoryCatalog();
      const db = adminDb();
      const [persisted, activeLoans] = await Promise.all([
        db.collection("inventoryItems").get(),
        db.collection("inventoryLoans").where("status", "in", ["REQUESTED", "BORROWED", "APPROVED"]).get(),
      ]);
      const overrides = new Map(persisted.docs.map((doc) => [doc.id, doc.data()]));
      const reserved = new Map<string, number>();
      for (const loan of activeLoans.docs) {
        const itemId = String(loan.get("itemId") ?? "");
        reserved.set(itemId, (reserved.get(itemId) ?? 0) + (Number(loan.get("quantity")) || 0));
      }
      return items.map((item) => {
        const override = overrides.get(item.itemId);
        const matches = override?.stockOverrideSourceFingerprint === inventoryFingerprint(item)
          && Number.isInteger(override.stockOverrideTotalQuantity);
        const totalQuantity = matches ? Number(override.stockOverrideTotalQuantity) : item.totalQuantity;
        const baselineAvailable = matches ? totalQuantity : item.availableQuantity;
        const borrowable = matches && typeof override.stockOverrideBorrowable === "boolean"
          ? override.stockOverrideBorrowable : item.borrowable;
        return {
          itemId: item.itemId, name: item.name, category: item.category,
          totalQuantity, availableQuantity: Math.max(0, Math.min(totalQuantity, baselineAvailable) - (reserved.get(item.itemId) ?? 0)),
          borrowable, stockNeedsReview: matches && typeof override.stockOverrideNeedsReview === "boolean"
            ? override.stockOverrideNeedsReview : item.stockNeedsReview,
          sourceStatus: matches && typeof override.stockOverrideStatus === "string"
            ? override.stockOverrideStatus : item.sourceStatus,
          description: item.description, detailsUrl: item.detailsUrl,
          sourceSheet: item.sourceSheet, sourceRow: item.sourceRow,
        };
      });
    }
    if (module === "equipment") {
      const [master, persisted] = await Promise.all([
        getEquipmentMaster(), adminDb().collection("equipment").get(),
      ]);
      const runtime = new Map(persisted.docs.map((doc) => [doc.id, doc.data()]));
      return master.map((item) => {
        const saved = runtime.get(item.equipmentId);
        const sheetMaintenance = /^(out[ -]of[ -]work|maintenance|under maintenance|unavailable|under repair|disabled)$/i.test(item.currentStatus.trim());
        const override = saved?.adminStatusOverride;
        const status = item.currentStatus.trim().toLowerCase() === "disabled" ? "DISABLED" : sheetMaintenance ? "MAINTENANCE"
          : ["AVAILABLE", "MAINTENANCE", "DISABLED"].includes(String(override)) ? String(override)
          : saved?.status === "IN_USE" ? "IN_USE" : "AVAILABLE";
        return {
          equipmentId: item.equipmentId, name: item.name, manufacturer: item.manufacturer ?? "",
          model: item.model ?? "", currentStatus: item.currentStatus, status,
          usageCount: Number(saved?.usageCount) || 0,
          activeUsageId: typeof saved?.activeUsageId === "string" ? saved.activeUsageId : "",
          statusSource: sheetMaintenance ? "Machinery Sheet" : override ? "Admin override" : "Machinery Sheet",
        };
      });
    }
    const snapshot = await adminDb().collection(config.collection).limit(100).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const record: Record<string, unknown> = { id: doc.id };
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
          record[key] = value.toDate().toISOString();
        } else if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
          record[key] = value;
        } else if (module === "admins" && key === "permissions" && Array.isArray(value)) {
          record[key] = value.filter((permission): permission is string => typeof permission === "string");
        }
      }
      return record;
    });
  });
}

export async function getAdminSnapshot(idToken: string | null): Promise<ActionResult<{ counts: Record<string, number>; role: string; permissions: AdminPermission[] }>> {
  return runAction(async () => {
    if (!idToken) throw new AuthError("Sign in to access administration.");
    const { actor } = await requireAdmin(idToken);
    const db = adminDb();
    const countPermissions: Record<string, AdminPermission> = {
      projects: "projects.view", inventoryItems: "inventory.view", inventoryLoans: "borrowings.view",
      equipment: "equipment.view", equipmentUsage: "equipmentUsage.view",
      adminUsers: "admins.view", adminAuditLogs: "auditLogs.view",
    };
    const visibleModules = MODULES.filter((name) => actor.role === "superadmin" || actor.permissions.includes(countPermissions[name]));
    const counts = await Promise.all(visibleModules.map(async (name) => {
      if (name === "inventoryItems") return [name, (await getInventoryCatalog()).length] as const;
      if (name === "equipment") return [name, (await getEquipmentMaster()).length] as const;
      const snapshot = await db.collection(name).count().get();
      return [name, snapshot.data().count] as const;
    }));
    return { counts: Object.fromEntries(counts), role: actor.role, permissions: actor.permissions };
  });
}

export async function setProjectAdminStatus(
  idToken: string | null,
  projectId: string,
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED",
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "projects.edit");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId) || !["ACTIVE", "COMPLETED", "ARCHIVED"].includes(status)) {
      throw new AuthError("Invalid project update.");
    }
    const ref = adminDb().collection("projects").doc(projectId);
    const before = await ref.get();
    if (!before.exists) throw new AuthError("Project not found.");
    await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
    await writeAdminAudit(actor, "project.status.updated", "projects", projectId);
    return true as const;
  });
}

export async function createProjectAsAdmin(
  idToken: string | null,
  input: { ownerEmail: string; title: string; category: string; shortDescription: string; description: string },
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "projects.create");
    const ownerEmail = input.ownerEmail.trim().toLowerCase();
    const title = input.title.trim();
    const shortDescription = input.shortDescription.trim();
    const description = input.description.trim();
    const categories: ProjectCategory[] = ["DIM", "PDR", "RESEARCH", "PERSONAL", "STARTUP"];
    if (!/^[^\s@]+@ahduni\.edu\.in$/.test(ownerEmail)
      || !title || title.length > 120 || !categories.includes(input.category as ProjectCategory)
      || !shortDescription || shortDescription.length > 300 || !description || description.length > 10000) {
      throw new AuthError("Check the owner email and project fields, then try again.");
    }
    let owner;
    try { owner = await adminAuth().getUserByEmail(ownerEmail); }
    catch { throw new AuthError("The project owner must already have a website account."); }
    if (owner.disabled || !owner.emailVerified) throw new AuthError("The project owner account must be verified and active.");
    const db = adminDb();
    const profileRef = db.collection("users").doc(owner.uid);
    const profile = await profileRef.get();
    if (!profile.exists || profile.get("profileCompleted") !== true || profile.get("uid") !== owner.uid) {
      throw new AuthError("The project owner must have a completed website profile.");
    }
    const projectRef = db.collection("projects").doc();
    const memberRef = projectRef.collection("members").doc(owner.uid);
    const now = FieldValue.serverTimestamp();
    const slug = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "project";
    await db.runTransaction(async (transaction) => {
      transaction.create(projectRef, {
        projectId: projectRef.id, title, slug, category: input.category,
        shortDescription, description, ownerUid: owner.uid, status: "ACTIVE",
        createdAt: now, updatedAt: now,
      });
      transaction.create(memberRef, {
        uid: owner.uid, name: String(profile.get("name") ?? ""), email: ownerEmail,
        role: "OWNER", joinedAt: now,
      });
    });
    await writeAdminAudit(actor, "project.created", "projects", projectRef.id);
    return true as const;
  });
}

export async function archiveProjectAsAdmin(idToken: string | null, projectId: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "projects.delete");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) throw new AuthError("Invalid project.");
    const ref = adminDb().collection("projects").doc(projectId);
    const project = await ref.get();
    if (!project.exists) throw new AuthError("Project not found.");
    if (project.get("status") === "ARCHIVED") throw new AuthError("This project is already archived.");
    await ref.update({ status: "ARCHIVED", archivedAt: FieldValue.serverTimestamp(), archivedByUid: actor.uid, updatedAt: FieldValue.serverTimestamp() });
    await writeAdminAudit(actor, "project.archived", "projects", projectId);
    return true as const;
  });
}

export async function deleteProjectAsAdmin(idToken: string | null, projectId: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "projects.delete");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) throw new AuthError("Invalid project.");
    const db = adminDb();
    const projectRef = db.collection("projects").doc(projectId);
    let previousStatus = "";
    await db.runTransaction(async (transaction) => {
      const project = await transaction.get(projectRef);
      if (!project.exists) throw new AuthError("Project not found.");
      previousStatus = String(project.get("status") ?? "ACTIVE");
      if (previousStatus === "DELETING") throw new AuthError("This project is already being deleted.");
      const [loans, usage] = await Promise.all([
        transaction.get(db.collection("inventoryLoans").where("projectId", "==", projectId)),
        transaction.get(db.collection("equipmentUsage").where("projectId", "==", projectId)),
      ]);
      if (!loans.empty || !usage.empty) {
        throw new AuthError("Remove this project’s borrowing and equipment usage history before deleting the project.");
      }
      transaction.update(projectRef, { status: "DELETING", updatedAt: FieldValue.serverTimestamp() });
    });
    try {
      await db.recursiveDelete(projectRef);
    } catch (error) {
      await projectRef.update({ status: previousStatus, updatedAt: FieldValue.serverTimestamp() }).catch(() => undefined);
      throw error;
    }
    await writeAdminAudit(actor, "project.deleted", "projects", projectId);
    return true as const;
  });
}

export async function updateProjectAdminDetails(
  idToken: string | null,
  projectId: string,
  input: { title: string; shortDescription: string; description: string; category: string },
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "projects.edit");
    const title = input.title.trim();
    const shortDescription = input.shortDescription.trim();
    const description = input.description.trim();
    const categories = ["DIM", "PDR", "RESEARCH", "PERSONAL", "STARTUP"];
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId) || !title || title.length > 120 || !shortDescription || shortDescription.length > 300 || !description || description.length > 10000 || !categories.includes(input.category)) {
      throw new AuthError("Check the project fields and try again.");
    }
    const ref = adminDb().collection("projects").doc(projectId);
    const before = await ref.get();
    if (!before.exists) throw new AuthError("Project not found.");
    await ref.update({ title, shortDescription, description, category: input.category, updatedAt: FieldValue.serverTimestamp() });
    await writeAdminAudit(actor, "project.details.updated", "projects", projectId);
    return true as const;
  });
}

export async function updateAdminInventoryQuantity(idToken: string | null, itemId: string, totalQuantity: number): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "inventory.edit");
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(itemId) || !Number.isInteger(totalQuantity) || totalQuantity < 0 || totalQuantity > 100000) throw new AuthError("Enter a valid inventory item and quantity.");
    const source = (await getInventoryCatalog()).find((item) => item.itemId === itemId);
    if (!source) throw new AuthError("Inventory item was not found in the live catalog.");
    const db=adminDb(), ref=db.collection("inventoryItems").doc(itemId);
    await db.runTransaction(async (tx) => {
      const [loans,item] = await Promise.all([tx.get(db.collection("inventoryLoans").where("itemId","==",itemId)),tx.get(ref)]);
      const reserved=loans.docs.filter((doc)=>["REQUESTED","BORROWED","APPROVED"].includes(String(doc.get("status")))).reduce((n,doc)=>n+(Number(doc.get("quantity"))||0),0);
      if(totalQuantity<reserved) throw new AuthError(`At least ${reserved} units are reserved or borrowed.`);
      const existingOverrideMatches = item.get("stockOverrideSourceFingerprint") === inventoryFingerprint(source);
      const effectiveBorrowable=existingOverrideMatches&&typeof item.get("stockOverrideBorrowable")==="boolean"?item.get("stockOverrideBorrowable"):source.borrowable;
      tx.set(ref,{...source,totalQuantity,availableQuantity:totalQuantity-reserved,borrowable:effectiveBorrowable,stockNeedsReview:false,sourceStatus:"Stock confirmed by administrator",stockOverrideTotalQuantity:totalQuantity,stockOverrideBorrowable:effectiveBorrowable,stockOverrideNeedsReview:false,stockOverrideStatus:"Stock confirmed by administrator",stockOverrideSourceFingerprint:inventoryFingerprint(source),updatedAt:FieldValue.serverTimestamp(),...(item.exists?{}:{createdAt:FieldValue.serverTimestamp()})},{merge:true});
      tx.set(db.collection("inventorySheetsOutbox").doc(`item_${itemId}`),{kind:"item",resourceId:itemId,status:"PENDING",version:FieldValue.increment(1),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    });
    await syncInventorySheetsRecord(`item_${itemId}`,db);
    await writeAdminAudit(actor,"inventory.quantity.updated","inventoryItems",itemId);
    return true as const;
  });
}

export async function updateAdminInventoryDetails(
  idToken: string | null,
  itemId: string,
  input: { description?: string; detailsUrl?: string },
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "inventory.edit");
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(itemId)) throw new AuthError("Choose a valid inventory item.");
    const source = (await getInventoryCatalog()).find((item) => item.itemId === itemId);
    if (!source) throw new AuthError("Inventory item was not found in the live catalog.");
    const supportsDescription = source.sourceSheet !== "Power tools Consumables";
    const supportsUrl = source.sourceSheet !== "Electrical and Electronics Comp";
    const description = input.description?.trim();
    const detailsUrl = input.detailsUrl?.trim();
    if (description !== undefined && (!supportsDescription || description.length > 1000)) {
      throw new AuthError("Description cannot be edited for this inventory category.");
    }
    if (detailsUrl !== undefined && (!supportsUrl || detailsUrl.length > 500 || detailsUrl && !/^https:\/\//i.test(detailsUrl))) {
      throw new AuthError("A valid HTTPS product link is required for this category.");
    }
    if (description === undefined && detailsUrl === undefined) throw new AuthError("No editable inventory details were provided.");
    await updateInventoryCatalogRow({
      sourceSheet: source.sourceSheet, sourceRow: source.sourceRow,
      sourceReference: source.sourceReference, name: source.name,
      ...(description !== undefined ? { description } : {}),
      ...(detailsUrl !== undefined ? { detailsUrl } : {}),
    });
    updateTag("google-equipment-catalog");
    await writeAdminAudit(actor, "inventory.details.updated", "inventoryItems", itemId);
    return true as const;
  });
}

export async function createAdminInventoryItem(
  idToken: string | null,
  input: { sourceSheet: string; name: string; description: string; model: string; detailsUrl: string; quantity: number },
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "inventory.create");
    const supportedSheets = ["Power tools", "Power tools Consumables", "Electrical and Electronics", "Electrical and Electronics Comp", "Hand tool 2.0", "Measurement Tools", "Safety Equipment"];
    const fields = {
      name: input.name.trim(), description: input.description.trim(), model: input.model.trim(),
      detailsUrl: input.detailsUrl.trim(), quantity: input.quantity,
    };
    if (!supportedSheets.includes(input.sourceSheet) || !fields.name || fields.name.length > 160
      || fields.description.length > 1000 || fields.model.length > 160 || fields.detailsUrl.length > 500
      || fields.detailsUrl && !/^https:\/\//i.test(fields.detailsUrl)
      || !Number.isInteger(fields.quantity) || fields.quantity < 0 || fields.quantity > 10000
      || [fields.name, fields.description, fields.model, fields.detailsUrl].some((value) => /^[=+\-@\t\r]/.test(value))) {
      throw new AuthError("Check the inventory item fields and try again.");
    }
    if (input.sourceSheet === "Electrical and Electronics Comp" && fields.detailsUrl) {
      throw new AuthError("Product links are not supported for the components source tab.");
    }
    if (input.sourceSheet === "Power tools Consumables" && fields.quantity !== 0) {
      throw new AuthError("Consumables need a separate physical stock count after they are listed.");
    }
    const catalog = await getInventoryCatalog();
    if (catalog.some((item) => item.sourceSheet === input.sourceSheet
      && item.name.trim().toLocaleLowerCase("en-US") === fields.name.toLocaleLowerCase("en-US")
      && (!fields.model || item.description.toLocaleLowerCase("en-US").includes(fields.model.toLocaleLowerCase("en-US"))))) {
      throw new AuthError("An item with this name and model already exists in that category. Update its stock instead.");
    }
    const result = await createInventoryCatalogRow({ sourceSheet: input.sourceSheet, fields });
    updateTag("google-equipment-catalog");
    const source = (await getInventoryCatalog()).find((item) => item.sourceSheet === input.sourceSheet && item.sourceRow === result.sourceRow);
    if (source) {
      const db = adminDb();
      await db.collection("inventoryItems").doc(source.itemId).set({
        ...source, stockOverrideTotalQuantity: source.totalQuantity,
        stockOverrideSourceFingerprint: inventoryFingerprint(source), stockOverrideBorrowable: source.borrowable,
        stockOverrideNeedsReview: source.stockNeedsReview, stockOverrideStatus: source.sourceStatus,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await db.collection("inventorySheetsOutbox").doc(`item_${source.itemId}`).set({
        kind: "item", resourceId: source.itemId, status: "PENDING", version: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await syncInventorySheetsRecord(`item_${source.itemId}`, db);
    }
    await writeAdminAudit(actor, "inventory.item.created", "inventoryItems", `${input.sourceSheet}:${result.sourceRow}`);
    return true as const;
  });
}

export async function setAdminInventoryBorrowable(idToken: string | null, itemId: string, borrowable: boolean): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "inventory.edit");
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(itemId) || typeof borrowable !== "boolean") throw new AuthError("Invalid inventory availability update.");
    const source = (await getInventoryCatalog()).find((item) => item.itemId === itemId);
    if (!source) throw new AuthError("Inventory item was not found in the live catalog.");
    const db = adminDb(), ref = db.collection("inventoryItems").doc(itemId);
    await db.runTransaction(async (tx) => {
      const [item, loans] = await Promise.all([
        tx.get(ref), tx.get(db.collection("inventoryLoans").where("itemId", "==", itemId)),
      ]);
      const active = loans.docs.filter((loan) => ["REQUESTED", "BORROWED", "APPROVED"].includes(String(loan.get("status"))))
        .reduce((sum, loan) => sum + (Number(loan.get("quantity")) || 0), 0);
      const matches = item.get("stockOverrideSourceFingerprint") === inventoryFingerprint(source)
        && Number.isInteger(item.get("stockOverrideTotalQuantity"));
      const total = matches ? Number(item.get("stockOverrideTotalQuantity")) : source.totalQuantity;
      const needsReview = matches && typeof item.get("stockOverrideNeedsReview") === "boolean"
        ? item.get("stockOverrideNeedsReview") : matches ? false : source.stockNeedsReview;
      if (borrowable && needsReview) throw new AuthError("Confirm the item's stock quantity before enabling borrowing.");
      if (borrowable && total <= 0) throw new AuthError("Add stock before enabling borrowing.");
      tx.set(ref, {
        ...source, totalQuantity: total, availableQuantity: Math.max(0, total - active), borrowable,
        stockNeedsReview: needsReview,
        sourceStatus: borrowable ? "Borrowing enabled by administrator" : "Lab use only by administrator",
        stockOverrideTotalQuantity: total, stockOverrideBorrowable: borrowable,
        stockOverrideNeedsReview: needsReview,
        stockOverrideStatus: borrowable ? "Borrowing enabled by administrator" : "Lab use only by administrator",
        stockOverrideSourceFingerprint: inventoryFingerprint(source), updatedAt: FieldValue.serverTimestamp(),
        ...(item.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      }, { merge: true });
      tx.set(db.collection("inventorySheetsOutbox").doc(`item_${itemId}`), {
        kind: "item", resourceId: itemId, status: "PENDING", version: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await syncInventorySheetsRecord(`item_${itemId}`, db);
    await writeAdminAudit(actor, borrowable ? "inventory.borrowing.enabled" : "inventory.borrowing.disabled", "inventoryItems", itemId);
    return true as const;
  });
}

export async function setAdminEquipmentStatus(
  idToken: string | null,
  equipmentId: string,
  status: "AVAILABLE" | "MAINTENANCE" | "DISABLED",
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "equipment.manage");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(equipmentId) || !["AVAILABLE", "MAINTENANCE", "DISABLED"].includes(status)) {
      throw new AuthError("Choose a valid machine and status.");
    }
    const source = (await getEquipmentMaster()).find((item) => item.equipmentId === equipmentId);
    if (!source || !source.srNo) throw new AuthError("Machine was not found in the live machinery catalog.");
    const sheetMaintenance = /^(out[ -]of[ -]work|maintenance|under maintenance|unavailable|under repair|disabled)$/i.test(source.currentStatus.trim());
    if (status === "AVAILABLE" && sheetMaintenance) {
      throw new AuthError("The machinery Sheet marks this machine unavailable. Update the Sheet first.");
    }
    const current = await adminDb().collection("equipment").doc(equipmentId).get();
    if (current.get("status") === "IN_USE" || current.get("activeUsageId")) {
      throw new AuthError("Resolve the active usage session before changing this machine’s status.");
    }
    const currentStatus = status === "AVAILABLE" ? "In Work" : status === "MAINTENANCE" ? "Out of work" : "Disabled";
    await updateMachinerySourceRow({
      sourceRow: source.sourceRow, srNo: source.srNo,
      fields: {
        name: source.name, manufacturer: source.manufacturer ?? "", model: source.model ?? "",
        detailsUrl: source.detailsUrl ?? "", type: source.type ?? "", quantity: source.quantity ?? 0,
        description: source.description ?? "", currentStatus,
        maintenancePartner: source.maintenancePartner ?? "", contact: source.contact ?? "",
      },
    });
    updateTag("google-equipment-catalog");
    await adminDb().collection("equipment").doc(equipmentId).set({
      status: status === "AVAILABLE" ? "AVAILABLE" : "MAINTENANCE",
      currentStatus, adminStatusOverride: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeAdminAudit(actor, "equipment.status.updated", "equipment", equipmentId);
    return true as const;
  });
}

export async function updateAdminEquipmentDetails(
  idToken: string | null,
  equipmentId: string,
  input: { name: string; manufacturer: string; model: string; detailsUrl: string; type: string; quantity: number; description: string; currentStatus: string; maintenancePartner: string; contact: string },
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "equipment.manage");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(equipmentId)) throw new AuthError("Choose a valid machine.");
    const source = (await getEquipmentMaster()).find((item) => item.equipmentId === equipmentId);
    if (!source || !source.srNo) throw new AuthError("Machine was not found in the live machinery catalog.");
    const fields = {
      name: input.name.trim(), manufacturer: input.manufacturer.trim(), model: input.model.trim(),
      detailsUrl: input.detailsUrl.trim(), type: input.type.trim(), quantity: input.quantity,
      description: input.description.trim(), currentStatus: input.currentStatus.trim(),
      maintenancePartner: input.maintenancePartner.trim(), contact: input.contact.trim(),
    };
    if (!fields.name || fields.name.length > 160 || fields.manufacturer.length > 160 || fields.model.length > 160
      || fields.type.length > 120 || fields.description.length > 1000 || fields.currentStatus.length > 100
      || fields.maintenancePartner.length > 200 || fields.contact.length > 100
      || fields.detailsUrl.length > 500 || fields.detailsUrl && !/^https:\/\//i.test(fields.detailsUrl)
      || !Number.isInteger(fields.quantity) || fields.quantity < 0 || fields.quantity > 10000) {
      throw new AuthError("Check the machine details and try again.");
    }
    const current = await adminDb().collection("equipment").doc(equipmentId).get();
    if (current.get("status") === "IN_USE" || current.get("activeUsageId")) {
      throw new AuthError("Resolve the active usage session before editing machine details.");
    }
    await updateMachinerySourceRow({ sourceRow: source.sourceRow, srNo: source.srNo, fields });
    updateTag("google-equipment-catalog");
    const sheetStatus = fields.currentStatus.toLowerCase() === "disabled" ? "DISABLED"
      : /^(out[ -]of[ -]work|maintenance|under maintenance|unavailable|under repair)$/i.test(fields.currentStatus)
        ? "MAINTENANCE" : "AVAILABLE";
    await adminDb().collection("equipment").doc(equipmentId).set({
      name: fields.name, manufacturer: fields.manufacturer, model: fields.model, type: fields.type,
      detailsUrl: fields.detailsUrl, quantity: fields.quantity, description: fields.description,
      currentStatus: fields.currentStatus, maintenancePartner: fields.maintenancePartner, contact: fields.contact,
      status: sheetStatus, adminStatusOverride: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await writeAdminAudit(actor, "equipment.details.updated", "equipment", equipmentId);
    return true as const;
  });
}

export async function returnBorrowingAsAdmin(idToken: string | null, loanId: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken,"borrowings.manage");
    const result=await returnInventoryItem(idToken,loanId);
    if(!result.ok) throw new AuthError(result.error);
    await writeAdminAudit(actor,"borrowing.returned.by_admin","inventoryLoans",loanId);
    return true as const;
  });
}

export async function decideBorrowingRequest(idToken: string | null, loanId: string, decision: "approve" | "reject"): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken,"borrowings.manage");
    if(!/^[A-Za-z0-9_-]{1,128}$/.test(loanId)) throw new AuthError("Invalid borrowing request.");
    const db=adminDb(), loanRef=db.collection("inventoryLoans").doc(loanId), catalog=await getInventoryCatalog();
    let itemId="";
    await db.runTransaction(async(tx)=>{
      const loan=await tx.get(loanRef);
      if(!loan.exists||loan.get("status")!=="REQUESTED") throw new AuthError("This request is no longer awaiting approval.");
      itemId=String(loan.get("itemId")??"");
      const itemRef=db.collection("inventoryItems").doc(itemId);
      const [item,loans]=await Promise.all([tx.get(itemRef),tx.get(db.collection("inventoryLoans").where("itemId","==",itemId))]);
      const source=catalog.find((entry)=>entry.itemId===itemId)??(item.exists?item.data() as InventoryItem:undefined);
      if(!source) throw new AuthError("Requested inventory item no longer exists.");
      const now=FieldValue.serverTimestamp();
      if(decision==="approve") {
        tx.update(loanRef,{status:"BORROWED",approvedAt:now,approvedByEmail:actor.email,borrowedAt:now,updatedAt:now});
        tx.set(db.collection("inventorySheetsOutbox").doc(`loan_${loanId}`),{kind:"loan",resourceId:loanId,status:"PENDING",version:FieldValue.increment(1),updatedAt:now},{merge:true});
      } else {
        const active=loans.docs.filter((doc)=>doc.id!==loanId&&["REQUESTED","BORROWED","APPROVED"].includes(String(doc.get("status")))).reduce((sum,doc)=>sum+(Number(doc.get("quantity"))||0),0);
        const data=item.data();
        const hasOverride=data?.stockOverrideSourceFingerprint===inventoryFingerprint(source)&&Number.isInteger(data.stockOverrideTotalQuantity);
        const total=hasOverride?Number(data.stockOverrideTotalQuantity):source.totalQuantity;
        const baseline=hasOverride?total:source.availableQuantity;
        tx.update(loanRef,{status:"REJECTED",rejectedAt:now,rejectedByEmail:actor.email,updatedAt:now});
        tx.set(itemRef,{...source,totalQuantity:total,availableQuantity:Math.max(0,Math.min(total,baseline)-active),updatedAt:now},{merge:true});
        tx.set(db.collection("inventorySheetsOutbox").doc(`item_${itemId}`),{kind:"item",resourceId:itemId,status:"PENDING",version:FieldValue.increment(1),updatedAt:now},{merge:true});
        tx.set(db.collection("inventorySheetsOutbox").doc(`loan_${loanId}`),{kind:"loan",resourceId:loanId,status:"PENDING",version:FieldValue.increment(1),updatedAt:now},{merge:true});
      }
    });
    await syncInventorySheetsRecord(`loan_${loanId}`,db);
    if(decision==="reject") await syncInventorySheetsRecord(`item_${itemId}`,db);
    await writeAdminAudit(actor,`borrowing.${decision}d`,"inventoryLoans",loanId);
    return true as const;
  });
}

export async function deleteBorrowingHistoryRecord(idToken: string | null, loanId: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "borrowings.manage");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(loanId)) throw new AuthError("Invalid borrowing record.");
    const db = adminDb();
    const loanRef = db.collection("inventoryLoans").doc(loanId);
    const outboxRef = db.collection("inventorySheetsOutbox").doc(`loan_${loanId}`);
    const catalog = await getInventoryCatalog().catch(() => []);
    let itemId = "";
    await db.runTransaction(async (transaction) => {
      const loan = await transaction.get(loanRef);
      if (!loan.exists) throw new AuthError("Borrowing record not found.");
      const status = String(loan.get("status"));
      if (["BORROWED", "APPROVED"].includes(status)) {
        throw new AuthError("Record the item’s return before deleting this borrowing history.");
      }
      if (!["REQUESTED", "REJECTED", "RETURNED"].includes(status)) {
        throw new AuthError("Only pending or completed borrowing records can be deleted.");
      }
      itemId = String(loan.get("itemId") ?? "");
      const itemRef = db.collection("inventoryItems").doc(itemId);
      const [item, loans, outbox] = await Promise.all([
        transaction.get(itemRef),
        transaction.get(db.collection("inventoryLoans").where("itemId", "==", itemId)),
        transaction.get(outboxRef),
      ]);
      if (status === "REQUESTED" && item.exists) {
        const source = catalog.find((entry) => entry.itemId === itemId)
          ?? item.data() as InventoryItem;
        const itemData = item.data();
        const hasOverride = itemData?.stockOverrideSourceFingerprint === inventoryFingerprint(source)
          && Number.isInteger(itemData.stockOverrideTotalQuantity);
        const total = hasOverride ? Number(itemData.stockOverrideTotalQuantity) : source.totalQuantity;
        const baseline = hasOverride ? total : source.availableQuantity;
        const reserved = loans.docs.filter((entry) => entry.id !== loanId
          && ["REQUESTED", "BORROWED", "APPROVED"].includes(String(entry.get("status"))))
          .reduce((sum, entry) => sum + (Number(entry.get("quantity")) || 0), 0);
        transaction.set(itemRef, { ...itemData, totalQuantity: total,
          availableQuantity: Math.max(0, Math.min(total, baseline) - reserved), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        transaction.set(db.collection("inventorySheetsOutbox").doc(`item_${itemId}`), {
          kind: "item", resourceId: itemId, status: "PENDING", version: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      transaction.delete(loanRef);
      transaction.set(outboxRef, {
        kind: "loanDelete", resourceId: loanId, status: "PENDING",
        version: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp(),
        ...(outbox.exists ? {} : { attempts: 0 }),
      }, { merge: true });
    });
    await syncInventorySheetsRecord(`loan_${loanId}`, db);
    if (itemId) await syncInventorySheetsRecord(`item_${itemId}`, db);
    await writeAdminAudit(actor, "borrowing.history.deleted", "inventoryLoans", loanId);
    return true as const;
  });
}

export async function resolveEquipmentUsageAsAdmin(idToken: string | null, usageId: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor }=await requireAdmin(idToken,"equipmentUsage.manage");
    const result=await endEquipmentUsage(idToken,usageId);
    if(!result.ok) throw new AuthError(result.error);
    await writeAdminAudit(actor,"equipmentUsage.resolved","equipmentUsage",usageId);
    return true as const;
  });
}

export async function deleteEquipmentUsageRecord(idToken: string | null, usageId: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "equipmentUsage.manage");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(usageId)) throw new AuthError("Invalid equipment usage record.");
    const db = adminDb();
    const usageRef = db.collection("equipmentUsage").doc(usageId);
    const outboxRef = db.collection("equipmentUsageSheetOutbox").doc(usageId);
    await db.runTransaction(async (transaction) => {
      const usage = await transaction.get(usageRef);
      if (!usage.exists) throw new AuthError("Equipment usage record not found.");
      const equipmentId = String(usage.get("equipmentId") ?? "");
      const equipmentRef = db.collection("equipment").doc(equipmentId);
      const [equipment, outbox] = await Promise.all([transaction.get(equipmentRef), transaction.get(outboxRef)]);
      if (equipment.exists && equipment.get("activeUsageId") === usageId) {
        const currentStatus = String(equipment.get("currentStatus") ?? "").trim().toLowerCase();
        const override = String(equipment.get("adminStatusOverride") ?? "");
        const status = currentStatus === "disabled" ? "DISABLED"
          : /^(out[ -]of[ -]work|maintenance|under maintenance|unavailable|under repair)$/.test(currentStatus) ? "MAINTENANCE"
          : ["AVAILABLE", "MAINTENANCE", "DISABLED"].includes(override) ? override : "AVAILABLE";
        transaction.update(equipmentRef, {
          status, activeUsageId: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp(),
        });
      }
      transaction.delete(usageRef);
      transaction.set(outboxRef, {
        kind: "DELETE", status: "PENDING", version: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp(),
        ...(outbox.exists ? {} : { attempts: 0 }),
      }, { merge: true });
    });
    await syncEquipmentUsageToGoogleSheets(usageId, db);
    await writeAdminAudit(actor, "equipmentUsage.record.deleted", "equipmentUsage", usageId);
    return true as const;
  });
}

export async function grantAdminAccess(idToken: string | null, email: string, permissions: AdminPermission[]): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "admins.manage");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@ahduni\.edu\.in$/.test(normalizedEmail)) throw new AuthError("Enter a university email address.");
    const allowed = [...new Set(permissions)].filter((permission) => ["projects.view","projects.create","projects.edit","projects.delete","inventory.view","inventory.create","inventory.edit","inventory.delete","borrowings.view","borrowings.manage","equipment.view","equipment.manage","equipmentUsage.view","equipmentUsage.manage"].includes(permission));
    if (!allowed.length) throw new AuthError("Choose at least one permission.");
    let user;
    try { user = await adminAuth().getUserByEmail(normalizedEmail); } catch { throw new AuthError("That account must sign in to the website once before admin access can be granted."); }
    if (!user.emailVerified || user.disabled) throw new AuthError("The university account must be verified and active.");
    if (user.uid === actor.uid) throw new AuthError("You cannot change your own admin permissions.");
    const ref = adminDb().collection("adminUsers").doc(user.uid);
    const existing = await ref.get();
    if (existing.exists && existing.get("role") === "superadmin") throw new AuthError("Superadmin roles cannot be changed here.");
    await ref.set({ uid:user.uid,email:normalizedEmail,role:"admin",permissions:allowed,active:true,grantedByUid:actor.uid,updatedAt:FieldValue.serverTimestamp(),...(existing.exists?{}:{createdAt:FieldValue.serverTimestamp()}) },{merge:true});
    await writeAdminAudit(actor,"admin.access.granted","adminUsers",user.uid);
    return true as const;
  });
}

export async function deactivateAdminAccess(idToken: string | null, uid: string): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "admins.manage");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || uid === actor.uid) throw new AuthError("You cannot deactivate your own access.");
    const ref=adminDb().collection("adminUsers").doc(uid); const target=await ref.get();
    if(!target.exists || target.get("role")!=="admin") throw new AuthError("Admin account not found.");
    await ref.update({active:false,updatedAt:FieldValue.serverTimestamp()});
    await writeAdminAudit(actor,"admin.access.deactivated","adminUsers",uid);
    return true as const;
  });
}

export async function updateAdminPermissions(
  idToken: string | null,
  uid: string,
  permissions: AdminPermission[],
): Promise<ActionResult<true>> {
  return runAction(async () => {
    const { actor } = await requireAdmin(idToken, "admins.manage");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || uid === actor.uid) {
      throw new AuthError("You cannot change your own admin permissions.");
    }
    const allowedPermissions = new Set<AdminPermission>([
      "projects.view", "projects.create", "projects.edit", "projects.delete",
      "inventory.view", "inventory.create", "inventory.edit", "inventory.delete",
      "borrowings.view", "borrowings.manage", "equipment.view", "equipment.manage", "equipmentUsage.view", "equipmentUsage.manage",
    ]);
    const normalized = [...new Set(permissions)].filter((permission) => allowedPermissions.has(permission));
    if (normalized.length === 0) throw new AuthError("Choose at least one permission.");
    const ref = adminDb().collection("adminUsers").doc(uid);
    const target = await ref.get();
    if (!target.exists || target.get("role") !== "admin") {
      throw new AuthError("Only an existing Admin account can be changed here.");
    }
    await ref.update({ permissions: normalized, updatedAt: FieldValue.serverTimestamp() });
    await writeAdminAudit(actor, "admin.permissions.updated", "adminUsers", uid);
    return true as const;
  });
}
