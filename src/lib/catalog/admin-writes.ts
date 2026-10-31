import "server-only";

type MachineryFields = {
  name: string;
  manufacturer: string;
  model: string;
  detailsUrl: string;
  type: string;
  quantity: number;
  description: string;
  currentStatus: string;
  maintenancePartner: string;
  contact: string;
};

export async function updateMachinerySourceRow(input: {
  sourceRow: number;
  srNo: number;
  fields: MachineryFields;
}): Promise<void> {
  const endpoint = process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL;
  const secret = process.env.EQUIPMENT_USAGE_SHEETS_SECRET;
  if (!endpoint || !secret) throw new Error("The machinery Sheets writer is not configured on this deployment.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.endsWith("/exec")) {
    throw new Error("The configured Sheets endpoint is invalid.");
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, machinery: input }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}.`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error : "Google Sheets did not confirm the equipment update.";
    throw new Error(message);
  }
}

export async function updateInventoryCatalogRow(input: {
  sourceSheet: string;
  sourceRow: number;
  sourceReference: string;
  name: string;
  description?: string;
  detailsUrl?: string;
}): Promise<void> {
  const endpoint = process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL;
  const secret = process.env.EQUIPMENT_USAGE_SHEETS_SECRET;
  if (!endpoint || !secret) throw new Error("The inventory Sheets writer is not configured on this deployment.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.endsWith("/exec")) {
    throw new Error("The configured Sheets endpoint is invalid.");
  }
  const response = await fetch(url, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, inventoryCatalog: input }), cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}.`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error : "Google Sheets did not confirm the inventory update.";
    throw new Error(message);
  }
}

export async function createInventoryCatalogRow(input: {
  sourceSheet: string;
  fields: { name: string; description: string; model: string; detailsUrl: string; quantity: number };
}): Promise<{ sourceRow: number; stockNeedsReview: boolean }> {
  const endpoint = process.env.EQUIPMENT_USAGE_SHEETS_WEBHOOK_URL;
  const secret = process.env.EQUIPMENT_USAGE_SHEETS_SECRET;
  if (!endpoint || !secret) throw new Error("The inventory Sheets writer is not configured on this deployment.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.endsWith("/exec")) {
    throw new Error("The configured Sheets endpoint is invalid.");
  }
  const response = await fetch(url, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, inventoryCatalogCreate: input }), cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}.`);
  const result: unknown = await response.json();
  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true
    || !("sourceRow" in result) || typeof result.sourceRow !== "number"
    || !("stockNeedsReview" in result) || typeof result.stockNeedsReview !== "boolean") {
    const message = result && typeof result === "object" && "error" in result && typeof result.error === "string"
      ? result.error : "Google Sheets did not confirm the inventory creation.";
    throw new Error(message);
  }
  return { sourceRow: result.sourceRow, stockNeedsReview: result.stockNeedsReview };
}
