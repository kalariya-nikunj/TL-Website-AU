import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { DocumentData, Firestore } from "firebase-admin/firestore";

const OUTBOX = "inventorySheetsOutbox";

function toIso(value: unknown): string {
  return value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
    ? value.toDate().toISOString()
    : "";
}

function serializeLoan(data: DocumentData, loanId: string) {
  return {
    loanId,
    itemId: String(data.itemId ?? ""),
    itemName: String(data.itemName ?? ""),
    category: String(data.category ?? ""),
    quantity: Number(data.quantity) || 0,
    status: String(data.status ?? "REQUESTED"),
    userUid: String(data.userUid ?? ""),
    userName: String(data.userName ?? ""),
    userEmail: String(data.userEmail ?? ""),
    projectId: String(data.projectId ?? ""),
    projectTitle: String(data.projectTitle ?? ""),
    requestedAt: toIso(data.requestedAt),
    approvedAt: toIso(data.approvedAt),
    approvedByEmail: String(data.approvedByEmail ?? ""),
    borrowedAt: toIso(data.borrowedAt),
    returnedAt: toIso(data.returnedAt),
    returnedByEmail: String(data.returnedByEmail ?? ""),
  };
}

function serializeItem(data: DocumentData, itemId: string) {
  return {
    itemId,
    name: String(data.name ?? ""),
    category: String(data.category ?? ""),
    totalQuantity: Number(data.totalQuantity) || 0,
    availableQuantity: Number(data.availableQuantity) || 0,
    borrowable: data.borrowable === true,
    stockNeedsReview: data.stockNeedsReview === true,
    sourceSheet: String(data.sourceSheet ?? ""),
    sourceRow: Number(data.sourceRow) || 0,
  };
}

export async function syncInventorySheetsRecord(outboxId: string, db: Firestore = adminDb()): Promise<void> {
  const webhookUrl = process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL?.trim();
  const sharedSecret = process.env.EQUIPMENT_USAGE_SHEETS_SECRET;
  if (!webhookUrl || !sharedSecret) return;

  const outboxRef = db.collection(OUTBOX).doc(outboxId);
  try {
    const outbox = await outboxRef.get();
    if (!outbox.exists || outbox.get("status") !== "PENDING") return;
    const version = Number(outbox.get("version") ?? 0);
    const kind = outbox.get("kind");
    const resourceId = String(outbox.get("resourceId") ?? "");
    if (!resourceId || (kind !== "loan" && kind !== "item")) throw new Error("Invalid inventory Sheets outbox record.");

    const resourceRef = db.collection(kind === "loan" ? "inventoryLoans" : "inventoryItems").doc(resourceId);
    const resource = await resourceRef.get();
    if (!resource.exists) throw new Error("Inventory record is unavailable.");
    const record = kind === "loan"
      ? serializeLoan(resource.data()!, resource.id)
      : serializeItem(resource.data()!, resource.id);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret: sharedSecret, inventory: { kind, version, record } }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json().catch(() => null) as { ok?: unknown } | null;
    if (!response.ok || result?.ok !== true) throw new Error(`Sheets endpoint rejected inventory update (HTTP ${response.status}).`);

    await db.runTransaction(async (transaction) => {
      const latest = await transaction.get(outboxRef);
      if (Number(latest.get("version") ?? 0) === version) {
        transaction.update(outboxRef, { status: "SYNCED", syncedAt: new Date(), lastError: "" });
      }
    });
  } catch (error) {
    const latest = await outboxRef.get().catch(() => null);
    await outboxRef.set({
      status: "PENDING",
      lastAttemptAt: new Date(),
      lastError: error instanceof Error ? error.message.slice(0, 240) : "Sheets sync failed.",
      attempts: Number(latest?.get("attempts") ?? 0) + 1,
    }, { merge: true }).catch(() => undefined);
    console.error("Inventory Sheets sync failed; Firebase record remains queued.");
  }
}

export async function retryPendingInventorySheets(db: Firestore = adminDb(), limit = 10): Promise<number> {
  if (!process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL || !process.env.EQUIPMENT_USAGE_SHEETS_SECRET) return 0;
  try {
    const pending = await db.collection(OUTBOX).where("status", "==", "PENDING").limit(Math.max(1, Math.min(50, limit))).get();
    for (const entry of pending.docs) await syncInventorySheetsRecord(entry.id, db);
    return pending.size;
  } catch (error) {
    console.error("Could not retry queued inventory Sheets records.", error instanceof Error ? error.name : "Error");
    return 0;
  }
}
