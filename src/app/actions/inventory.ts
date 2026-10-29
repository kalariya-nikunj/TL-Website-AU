"use server";

import { FieldValue, type DocumentData, type Transaction } from "firebase-admin/firestore";

import { AuthError, requireUser, runAction, type ActionResult } from "@/lib/auth/verify";
import { adminDb } from "@/lib/firebase/admin";
import type { InventoryData, InventoryItem, InventoryLoan } from "@/types/inventory";
import { syncInventorySheetsRecord } from "@/lib/inventory/sheets-sync";
import { getInventoryCatalog } from "@/lib/catalog/live";

const MAX_BORROW_QUANTITY = 100;

function iso(value: unknown): string {
  return value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate().toISOString()
    : "";
}

function sourceFingerprint(source: InventoryItem): string {
  return JSON.stringify([
    source.name, source.category, source.description, source.sourceSheet, source.sourceRow,
    source.detailsUrl, source.totalQuantity, source.availableQuantity, source.borrowable,
    source.stockNeedsReview, source.sourceStatus,
  ]);
}

function serializeItem(source: InventoryItem, data: DocumentData | undefined, activeQuantity: number): InventoryItem {
  const stockOverrideMatches = data?.stockOverrideSourceFingerprint === sourceFingerprint(source)
    && Number.isInteger(data.stockOverrideTotalQuantity);
  const totalQuantity = stockOverrideMatches ? Number(data.stockOverrideTotalQuantity) : source.totalQuantity;
  const sourceAvailable = stockOverrideMatches ? totalQuantity : source.availableQuantity;
  return {
    ...source,
    totalQuantity,
    availableQuantity: Math.max(0, Math.min(totalQuantity, sourceAvailable) - activeQuantity),
    ...(stockOverrideMatches
      ? {
          stockNeedsReview: false,
          sourceStatus: typeof data?.sourceStatus === "string" ? data.sourceStatus : source.sourceStatus,
        }
      : {}),
  };
}

function serializeLoan(data: DocumentData, loanId: string): InventoryLoan {
  return {
    loanId,
    itemId: String(data.itemId ?? ""),
    itemName: String(data.itemName ?? "Inventory item"),
    category: String(data.category ?? ""),
    quantity: Number.isInteger(data.quantity) ? data.quantity : 1,
    status: ["REQUESTED", "BORROWED", "APPROVED", "REJECTED", "RETURNED"].includes(String(data.status)) ? data.status : "REQUESTED",
    ...(typeof data.userName === "string" ? { borrowerName: data.userName } : {}),
    ...(typeof data.userEmail === "string" ? { borrowerEmail: data.userEmail } : {}),
    projectId: String(data.projectId ?? ""),
    projectTitle: String(data.projectTitle ?? ""),
    requestedAt: iso(data.requestedAt),
    ...(data.approvedAt ? { approvedAt: iso(data.approvedAt) } : {}),
    ...(typeof data.approvedByEmail === "string" ? { approvedByEmail: data.approvedByEmail } : {}),
    borrowedAt: iso(data.borrowedAt),
    ...(data.returnedAt ? { returnedAt: iso(data.returnedAt) } : {}),
  };
}

function enqueueSheetRecord(transaction: Transaction, db: ReturnType<typeof adminDb>, kind: "loan" | "item", resourceId: string) {
  transaction.set(db.collection("inventorySheetsOutbox").doc(`${kind}_${resourceId}`), {
    kind,
    resourceId,
    status: "PENDING",
    version: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function accessibleProjects(uid: string) {
  const db = adminDb();
  const [owned, memberships] = await Promise.all([
    db.collection("projects").where("ownerUid", "==", uid).get(),
    db.collectionGroup("members").where("uid", "==", uid).get(),
  ]);
  const ids = new Set([
    ...owned.docs.map((doc) => doc.id),
    ...memberships.docs.filter((doc) => ["OWNER", "MEMBER"].includes(String(doc.get("role"))))
      .map((doc) => doc.ref.parent.parent?.id).filter((id): id is string => Boolean(id)),
  ]);
  const values = await Promise.all([...ids].map(async (id) => {
    const snapshot = await db.collection("projects").doc(id).get();
    if (!snapshot.exists) return null;
    const isMember = memberships.docs.some((doc) => doc.ref.parent.parent?.id === id && ["OWNER", "MEMBER"].includes(String(doc.get("role"))));
    if (snapshot.get("ownerUid") !== uid && !isMember) return null;
    return { projectId: id, title: String(snapshot.get("title") ?? "") };
  }));
  return values.filter((project): project is { projectId: string; title: string } => Boolean(project)).sort((a, b) => a.title.localeCompare(b.title));
}

function isInventoryAdmin(email: string | undefined): boolean {
  const allowlist = (process.env.INVENTORY_ADMIN_EMAILS ?? "").split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowlist.includes(email.toLowerCase()));
}

export async function getInventoryData(idToken: string | null): Promise<ActionResult<InventoryData>> {
  return runAction(async () => {
    let uid = "";
    let isAdmin = false;
    if (idToken) {
      const user = await requireUser(idToken);
      uid = user.uid;
      isAdmin = isInventoryAdmin(user.email);
    }
    const db = adminDb();
    const [catalog, itemSnapshots, loansSnapshot, projects, activeLoansSnapshot] = await Promise.all([
      getInventoryCatalog(),
      db.collection("inventoryItems").get(),
      uid ? (isAdmin ? db.collection("inventoryLoans").get() : db.collection("inventoryLoans").where("userUid", "==", uid).get()) : Promise.resolve(null),
      uid ? accessibleProjects(uid) : Promise.resolve([]),
      db.collection("inventoryLoans").where("status", "in", ["REQUESTED", "BORROWED", "APPROVED"]).get(),
    ]);
    const persistedItems = new Map(itemSnapshots.docs.map((document) => [document.id, document.data()]));
    const activeQuantityByItem = new Map<string, number>();
    for (const loan of activeLoansSnapshot.docs) {
      const itemId = String(loan.get("itemId") ?? "");
      activeQuantityByItem.set(itemId, (activeQuantityByItem.get(itemId) ?? 0) + (Number(loan.get("quantity")) || 0));
    }
    const items = catalog.map((item) => serializeItem(item, persistedItems.get(item.itemId), activeQuantityByItem.get(item.itemId) ?? 0));
    const loans = loansSnapshot?.docs
      .map((document) => serializeLoan(document.data(), document.id))
      .sort((a, b) => (b.requestedAt || b.borrowedAt).localeCompare(a.requestedAt || a.borrowedAt)) ?? [];
    return { items, loans, projects, signedIn: Boolean(uid), isAdmin };
  });
}

export async function borrowInventoryItem(
  idToken: string | null,
  itemId: string,
  quantity: number,
  projectId: string,
): Promise<ActionResult<InventoryLoan>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_BORROW_QUANTITY) {
      throw new AuthError("Choose a valid quantity to borrow.");
    }
    const source = (await getInventoryCatalog()).find((item) => item.itemId === itemId);
    if (!source) throw new AuthError("That inventory item is not available.");
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(projectId)) throw new AuthError("Select a project for this borrowing request.");

    const db = adminDb();
    const itemRef = db.collection("inventoryItems").doc(itemId);
    const loanRef = db.collection("inventoryLoans").doc();
    const projectRef = db.collection("projects").doc(projectId);
    const memberRef = projectRef.collection("members").doc(user.uid);
    const now = FieldValue.serverTimestamp();
    let projectTitle = "";

    await db.runTransaction(async (transaction) => {
      const [itemSnapshot, project, member, itemLoans] = await Promise.all([
        transaction.get(itemRef), transaction.get(projectRef), transaction.get(memberRef),
        transaction.get(db.collection("inventoryLoans").where("itemId", "==", itemId)),
      ]);
      const authorizedProject = project.exists && (project.get("ownerUid") === user.uid || member.exists && member.get("uid") === user.uid && ["OWNER", "MEMBER"].includes(String(member.get("role"))));
      if (!authorizedProject) throw new AuthError("Choose a project you own or belong to.");
      projectTitle = String(project.get("title") ?? "");
      const storedItem = itemSnapshot.data();
      const stockOverrideMatches = storedItem?.stockOverrideSourceFingerprint === sourceFingerprint(source)
        && Number.isInteger(storedItem.stockOverrideTotalQuantity);
      const total = stockOverrideMatches ? Number(storedItem.stockOverrideTotalQuantity) : source.totalQuantity;
      const baseAvailable = stockOverrideMatches ? total : source.availableQuantity;
      const activeQuantity = itemLoans.docs
        .filter((loan) => ["REQUESTED", "BORROWED", "APPROVED"].includes(String(loan.get("status"))))
        .reduce((sum, loan) => sum + (Number(loan.get("quantity")) || 0), 0);
      const available = Math.max(0, Math.min(total, baseAvailable) - activeQuantity);
      const borrowable = source.borrowable;
      const needsReview = source.stockNeedsReview;
      if (!borrowable || needsReview) throw new AuthError("This item is not available to borrow yet; please ask lab staff to confirm its stock.");
      if (quantity > available) throw new AuthError(`Only ${available} ${available === 1 ? "unit is" : "units are"} available.`);
      if (!itemSnapshot.exists) {
        transaction.create(itemRef, {
          ...source,
          totalQuantity: total,
          availableQuantity: available - quantity,
          updatedAt: now,
          createdAt: now,
        });
      } else {
        transaction.update(itemRef, { totalQuantity: total, availableQuantity: available - quantity, updatedAt: now });
      }
      transaction.create(loanRef, {
        loanId: loanRef.id,
        itemId,
        itemName: source.name,
        category: source.category,
        quantity,
        status: "BORROWED",
        userUid: user.uid,
        userEmail: user.email ?? "",
        userName: user.name ?? (user.email ?? "Student").split("@")[0],
        projectId,
        projectTitle,
        requestedAt: now,
        // Checkout is self-service, so the implicit approval time is the
        // same as the borrowing time. This also keeps the existing Sheets
        // "Approved at" column populated until the sheet schema is deployed.
        approvedAt: now,
        approvedByEmail: "",
        borrowedAt: now,
        returnedAt: null,
      });
      enqueueSheetRecord(transaction, db, "loan", loanRef.id);
      enqueueSheetRecord(transaction, db, "item", itemId);
    });

    await Promise.all([
      syncInventorySheetsRecord(`loan_${loanRef.id}`, db),
      syncInventorySheetsRecord(`item_${itemId}`, db),
    ]);

    return {
      loanId: loanRef.id,
      itemId,
      itemName: source.name,
      category: source.category,
      quantity,
      status: "BORROWED",
      projectId,
      projectTitle,
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      borrowedAt: new Date().toISOString(),
    };
  });
}

export async function returnInventoryItem(
  idToken: string | null,
  loanId: string,
): Promise<ActionResult<InventoryLoan>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(loanId)) throw new AuthError("That borrowing record is not valid.");
    const db = adminDb();
    const catalog = await getInventoryCatalog();
    const loanRef = db.collection("inventoryLoans").doc(loanId);
    const now = FieldValue.serverTimestamp();
    let returned: InventoryLoan | null = null;

    await db.runTransaction(async (transaction) => {
      const loan = await transaction.get(loanRef);
      const isAdmin = isInventoryAdmin(user.email);
      if (!loan.exists || (loan.get("userUid") !== user.uid && !isAdmin)) throw new AuthError("Borrowing record not found.");
      if (!["BORROWED", "APPROVED"].includes(String(loan.get("status")))) throw new AuthError("Only an active borrowing can be returned.");
      const itemId = String(loan.get("itemId") ?? "");
      const itemRef = db.collection("inventoryItems").doc(itemId);
      const [item, itemLoans] = await Promise.all([
        transaction.get(itemRef),
        transaction.get(db.collection("inventoryLoans").where("itemId", "==", itemId)),
      ]);
      const source = catalog.find((entry) => entry.itemId === itemId)
        ?? (item.exists ? item.data() as InventoryItem : undefined);
      if (!source) throw new AuthError("Inventory item not found.");
      const quantity = Number(loan.get("quantity")) || 1;
      const itemData = item.data();
      const stockOverrideMatches = itemData?.stockOverrideSourceFingerprint === sourceFingerprint(source)
        && Number.isInteger(itemData.stockOverrideTotalQuantity);
      const totalQuantity = stockOverrideMatches ? Number(itemData.stockOverrideTotalQuantity) : source.totalQuantity;
      const activeQuantity = itemLoans.docs
        .filter((entry) => entry.id !== loanId && ["REQUESTED", "BORROWED", "APPROVED"].includes(String(entry.get("status"))))
        .reduce((sum, entry) => sum + (Number(entry.get("quantity")) || 0), 0);
      const baselineAvailable = stockOverrideMatches ? totalQuantity : source.availableQuantity;
      const nextAvailable = Math.max(0, Math.min(totalQuantity, baselineAvailable) - activeQuantity);
      transaction.update(loanRef, { status: "RETURNED", returnedAt: now, returnedByEmail: user.email ?? "", updatedAt: now });
      if (item.exists) {
        transaction.update(itemRef, { availableQuantity: nextAvailable, updatedAt: now });
      } else {
        transaction.create(itemRef, { ...source, availableQuantity: nextAvailable, createdAt: now, updatedAt: now });
      }
      returned = {
        loanId,
        itemId,
        itemName: String(loan.get("itemName") ?? source.name),
        category: source.category,
        quantity,
        status: "RETURNED",
        projectId: String(loan.get("projectId") ?? ""),
        projectTitle: String(loan.get("projectTitle") ?? ""),
        requestedAt: iso(loan.get("requestedAt")),
        approvedAt: iso(loan.get("approvedAt")),
        approvedByEmail: String(loan.get("approvedByEmail") ?? ""),
        borrowedAt: iso(loan.get("borrowedAt")),
        returnedAt: new Date().toISOString(),
      };
      enqueueSheetRecord(transaction, db, "loan", loanId);
      enqueueSheetRecord(transaction, db, "item", itemId);
    });
    const returnedRecord = returned as InventoryLoan | null;
    if (!returnedRecord) throw new AuthError("Could not record the return.");
    await Promise.all([
      syncInventorySheetsRecord(`loan_${loanId}`, db),
      syncInventorySheetsRecord(`item_${returnedRecord.itemId}`, db),
    ]);
    return returnedRecord;
  });
}

export async function updateInventoryStock(
  idToken: string | null,
  itemId: string,
  totalQuantity: number,
): Promise<ActionResult<InventoryItem>> {
  return runAction(async () => {
    const user = await requireUser(idToken);
    if (!isInventoryAdmin(user.email)) throw new AuthError("Only an authorized lab inventory administrator can update stock.");
    if (!Number.isInteger(totalQuantity) || totalQuantity < 0 || totalQuantity > 100_000) {
      throw new AuthError("Enter a valid total stock quantity.");
    }
    const source = (await getInventoryCatalog()).find((item) => item.itemId === itemId);
    if (!source) throw new AuthError("That inventory item is not available.");
    const db = adminDb();
    const itemRef = db.collection("inventoryItems").doc(itemId);
    let updated: InventoryItem | null = null;
    await db.runTransaction(async (transaction) => {
      const [activeLoans, itemSnapshot] = await Promise.all([
        transaction.get(db.collection("inventoryLoans").where("itemId", "==", itemId)),
        transaction.get(itemRef),
      ]);
      const activeQuantity = activeLoans.docs
        // Requests reserve stock when submitted, so pending approvals count too.
        .filter((loan) => ["REQUESTED", "BORROWED", "APPROVED"].includes(String(loan.get("status"))))
        .reduce((sum, loan) => sum + (Number(loan.get("quantity")) || 0), 0);
      if (totalQuantity < activeQuantity) throw new AuthError(`At least ${activeQuantity} unit(s) must remain in stock while requests are pending or items are borrowed.`);
      const next = {
        ...source,
        totalQuantity,
        availableQuantity: totalQuantity - activeQuantity,
        borrowable: source.borrowable,
        stockNeedsReview: false,
        sourceStatus: "Stock confirmed by lab administrator",
        stockOverrideTotalQuantity: totalQuantity,
        stockOverrideSourceFingerprint: sourceFingerprint(source),
        updatedAt: FieldValue.serverTimestamp(),
        ...(itemSnapshot.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      };
      transaction.set(itemRef, next, { merge: true });
      enqueueSheetRecord(transaction, db, "item", itemId);
      updated = { ...source, totalQuantity, availableQuantity: totalQuantity - activeQuantity, stockNeedsReview: false, sourceStatus: next.sourceStatus };
    });
    if (!updated) throw new AuthError("Could not save stock quantity.");
    await syncInventorySheetsRecord(`item_${itemId}`, db);
    return updated;
  });
}
