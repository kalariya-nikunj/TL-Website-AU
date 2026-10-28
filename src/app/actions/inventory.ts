"use server";

import { FieldValue, type DocumentData, type Transaction } from "firebase-admin/firestore";

import { AuthError, requireUser, runAction, type ActionResult } from "@/lib/auth/verify";
import { adminDb } from "@/lib/firebase/admin";
import type { InventoryData, InventoryItem, InventoryLoan } from "@/types/inventory";
import { syncInventorySheetsRecord } from "@/lib/inventory/sheets-sync";
import sourceCatalog from "../../../scripts/inventory-catalog.json";

const CATALOG = sourceCatalog as InventoryItem[];
const itemById = new Map(CATALOG.map((item) => [item.itemId, item]));
const MAX_BORROW_QUANTITY = 100;

function iso(value: unknown): string {
  return value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate().toISOString()
    : "";
}

function serializeItem(data: DocumentData, itemId: string, source: InventoryItem): InventoryItem {
  return {
    ...source,
    itemId,
    totalQuantity: Number.isInteger(data.totalQuantity) ? data.totalQuantity : source.totalQuantity,
    availableQuantity: Number.isInteger(data.availableQuantity) ? data.availableQuantity : source.availableQuantity,
    borrowable: data.borrowable === false ? false : source.borrowable,
    stockNeedsReview: data.stockNeedsReview === false ? false : source.stockNeedsReview,
    sourceStatus: typeof data.sourceStatus === "string" ? data.sourceStatus : source.sourceStatus,
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
    const [itemSnapshots, loansSnapshot, projects] = await Promise.all([
      db.collection("inventoryItems").get(),
      uid ? (isAdmin ? db.collection("inventoryLoans").get() : db.collection("inventoryLoans").where("userUid", "==", uid).get()) : Promise.resolve(null),
      uid ? accessibleProjects(uid) : Promise.resolve([]),
    ]);
    const persistedItems = new Map(itemSnapshots.docs.map((document) => [document.id, document.data()]));
    const items = CATALOG.map((item) => persistedItems.has(item.itemId)
      ? serializeItem(persistedItems.get(item.itemId)!, item.itemId, item)
      : item);
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
    const source = itemById.get(itemId);
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
      const [itemSnapshot, project, member] = await Promise.all([
        transaction.get(itemRef), transaction.get(projectRef), transaction.get(memberRef),
      ]);
      const authorizedProject = project.exists && (project.get("ownerUid") === user.uid || member.exists && member.get("uid") === user.uid && ["OWNER", "MEMBER"].includes(String(member.get("role"))));
      if (!authorizedProject) throw new AuthError("Choose a project you own or belong to.");
      projectTitle = String(project.get("title") ?? "");
      const available = itemSnapshot.exists && Number.isInteger(itemSnapshot.get("availableQuantity"))
        ? Number(itemSnapshot.get("availableQuantity"))
        : source.availableQuantity;
      const borrowable = itemSnapshot.exists ? itemSnapshot.get("borrowable") !== false : source.borrowable;
      const needsReview = itemSnapshot.exists ? itemSnapshot.get("stockNeedsReview") === true : source.stockNeedsReview;
      if (!borrowable || needsReview) throw new AuthError("This item is not available to borrow yet; please ask lab staff to confirm its stock.");
      if (quantity > available) throw new AuthError(`Only ${available} ${available === 1 ? "unit is" : "units are"} available.`);
      if (!itemSnapshot.exists) {
        transaction.create(itemRef, {
          ...source,
          availableQuantity: available - quantity,
          updatedAt: now,
          createdAt: now,
        });
      } else {
        transaction.update(itemRef, { availableQuantity: available - quantity, updatedAt: now });
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
    const loanRef = db.collection("inventoryLoans").doc(loanId);
    const now = FieldValue.serverTimestamp();
    let returned: InventoryLoan | null = null;

    await db.runTransaction(async (transaction) => {
      const loan = await transaction.get(loanRef);
      const isAdmin = isInventoryAdmin(user.email);
      if (!loan.exists || (loan.get("userUid") !== user.uid && !isAdmin)) throw new AuthError("Borrowing record not found.");
      if (!["BORROWED", "APPROVED"].includes(String(loan.get("status")))) throw new AuthError("Only an active borrowing can be returned.");
      const itemId = String(loan.get("itemId") ?? "");
      const source = itemById.get(itemId);
      if (!source) throw new AuthError("Inventory item not found.");
      const itemRef = db.collection("inventoryItems").doc(itemId);
      const item = await transaction.get(itemRef);
      const quantity = Number(loan.get("quantity")) || 1;
      const totalQuantity = item.exists && Number.isInteger(item.get("totalQuantity"))
        ? Number(item.get("totalQuantity"))
        : source.totalQuantity;
      const availableQuantity = item.exists && Number.isInteger(item.get("availableQuantity"))
        ? Number(item.get("availableQuantity"))
        : source.availableQuantity;
      const nextAvailable = Math.min(totalQuantity, availableQuantity + quantity);
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
    const source = itemById.get(itemId);
    if (!source) throw new AuthError("That inventory item is not available.");
    const db = adminDb();
    const itemRef = db.collection("inventoryItems").doc(itemId);
    let updated: InventoryItem | null = null;
    await db.runTransaction(async (transaction) => {
      const activeLoans = await transaction.get(db.collection("inventoryLoans").where("itemId", "==", itemId));
      const activeQuantity = activeLoans.docs
        // Requests reserve stock when submitted, so pending approvals count too.
        .filter((loan) => ["REQUESTED", "BORROWED", "APPROVED"].includes(String(loan.get("status"))))
        .reduce((sum, loan) => sum + (Number(loan.get("quantity")) || 0), 0);
      if (totalQuantity < activeQuantity) throw new AuthError(`At least ${activeQuantity} unit(s) must remain in stock while requests are pending or items are borrowed.`);
      const itemSnapshot = await transaction.get(itemRef);
      const next = {
        ...source,
        totalQuantity,
        availableQuantity: totalQuantity - activeQuantity,
        borrowable: source.borrowable,
        stockNeedsReview: false,
        sourceStatus: "Stock confirmed by lab administrator",
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
