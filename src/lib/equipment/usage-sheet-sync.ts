import "server-only";

import type { DocumentData, Firestore } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";

const OUTBOX = "equipmentUsageSheetOutbox";

type UsagePayload = {
  usageId: string;
  equipmentId: string;
  equipmentName: string;
  userUid: string;
  userName: string;
  projectId: string;
  projectTitle: string;
  status: "ACTIVE" | "COMPLETED" | "RECORDED";
  startedAt: string;
  endedAt: string;
  endedByEmail: string;
  endReason: string;
  usageNumber: number;
};

function timestampToIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return "";
}

function serializeUsage(data: DocumentData, usageId: string): UsagePayload {
  return {
    usageId,
    equipmentId: String(data.equipmentId ?? ""),
    equipmentName: String(data.equipmentName ?? ""),
    userUid: String(data.userUid ?? ""),
    userName: String(data.userName ?? ""),
    projectId: String(data.projectId ?? ""),
    projectTitle: String(data.projectTitle ?? ""),
    status: data.status === "COMPLETED" ? "COMPLETED" : data.status === "RECORDED" ? "RECORDED" : "ACTIVE",
    startedAt: timestampToIso(data.startedAt),
    endedAt: timestampToIso(data.endedAt),
    endedByEmail: String(data.endedByEmail ?? ""),
    endReason: String(data.endReason ?? ""),
    usageNumber: typeof data.usageNumber === "number" ? data.usageNumber : 0,
  };
}

export async function syncEquipmentUsageToGoogleSheets(usageId: string, db?: Firestore): Promise<void> {
  try {
    const database = db ?? adminDb();
    const webhookUrl = process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL?.trim();
    const sharedSecret = process.env.EQUIPMENT_USAGE_SHEETS_SECRET;
    if (!webhookUrl || !sharedSecret) return;

    const outboxRef = database.collection(OUTBOX).doc(usageId);
    const outbox = await outboxRef.get();
    if (!outbox.exists || outbox.get("status") !== "PENDING") return;
    const version = Number(outbox.get("version") ?? 0);

    try {
      const usage = await database.collection("equipmentUsage").doc(usageId).get();
      if (!usage.exists) throw new Error("Usage record is unavailable.");
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret: sharedSecret, version, usage: serializeUsage(usage.data()!, usageId) }),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      const responseData = await response.json().catch(() => null) as { ok?: unknown } | null;
      if (!response.ok || responseData?.ok !== true) {
        throw new Error(`Google Sheets webhook rejected the update (HTTP ${response.status}).`);
      }

      await database.runTransaction(async (transaction) => {
        const latest = await transaction.get(outboxRef);
        if (Number(latest.get("version") ?? 0) === version) {
          transaction.update(outboxRef, { status: "SYNCED", syncedAt: new Date(), lastError: "" });
        }
      });
    } catch (error) {
      await outboxRef.set({
        status: "PENDING",
        lastAttemptAt: new Date(),
        lastError: error instanceof Error ? error.message.slice(0, 240) : "Sheets sync failed.",
        attempts: Number(outbox.get("attempts") ?? 0) + 1,
      }, { merge: true });
      console.error("Equipment usage Sheets sync failed; record remains queued.");
    }
  } catch {
    // Never turn a committed equipment action into a false failure just because
    // Google Sheets or the optional synchronization metadata is unavailable.
    console.error("Equipment usage Sheets sync did not complete; queued record remains in Firestore.");
  }
}

export async function retryPendingEquipmentUsageSheetSync(db: Firestore = adminDb(), skipUsageId = ""): Promise<number> {
  if (!process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL || !process.env.EQUIPMENT_USAGE_SHEETS_SECRET) return 0;
  try {
    const pending = await db.collection(OUTBOX).where("status", "==", "PENDING").limit(10).get();
    const next = pending.docs.find((document) => document.id !== skipUsageId);
    if (!next) return 0;
    await syncEquipmentUsageToGoogleSheets(next.id, db);
    return 1;
  } catch {
    console.error("Could not retry the queued equipment usage Sheets update.");
    return 0;
  }
}
