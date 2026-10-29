import "server-only";

import type { InventoryItem } from "@/types/inventory";
import type { Equipment } from "@/types/equipment";

const SPREADSHEET_ID = "1pLU19yBwdiKiqIwnYh2HzStN6FM74oL-uc__ABwNayU";
const SHEET_GIDS = {
  powerTools: "0",
  consumables: "1994125015",
  machinery: "1308933560",
  electrical: "1112580146",
  components: "546701528",
  handTools: "856206127",
  measurement: "58606889",
  safety: "56245970",
} as const;

type SheetKey = keyof typeof SHEET_GIDS;
export type LiveEquipmentMaster = Omit<Equipment, "status" | "isActive"> & {
  currentStatus: string;
};

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = csv.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function readSheet(key: SheetKey): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GIDS[key]}`;
  const response = await fetch(url, {
    next: { revalidate: 30, tags: ["google-equipment-catalog"] },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Google Sheet returned HTTP ${response.status} for ${key}.`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/csv")) throw new Error(`Google Sheet returned an unexpected format for ${key}.`);
  return parseCsv(await response.text());
}

function clean(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\uFFFD/g, "-").trim();
}

function number(value: unknown): number | null {
  const parsed = Number(clean(value));
  return clean(value) && Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null;
}

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "inventory-item";
}

function makeItem(
  sheetName: string,
  rowNumber: number,
  sourceReference: unknown,
  nameValue: unknown,
  descriptionValue: unknown,
  modelValue: unknown,
  urlValue: unknown,
  totalValue: number | null,
  availableValue: number | null,
  borrowable = true,
  stockNeedsReview = false,
  state = "",
): InventoryItem | null {
  const name = clean(nameValue);
  if (!name) return null;
  const model = clean(modelValue);
  const description = [clean(descriptionValue), model].filter(Boolean).join(" · ");
  const detailsUrl = clean(urlValue);
  return {
    itemId: `${slug(sheetName)}-${slug(name)}${model ? `-${slug(model)}` : ""}`.slice(0, 120),
    name,
    category: sheetName,
    description: description || "Inventory item listed in the Tinkerers Lab inventory workbook.",
    sourceSheet: sheetName,
    sourceRow: rowNumber,
    sourceReference: clean(sourceReference),
    detailsUrl: detailsUrl.startsWith("https://") ? detailsUrl : "",
    totalQuantity: Math.max(0, totalValue ?? 0),
    availableQuantity: Math.max(0, availableValue ?? 0),
    borrowable,
    stockNeedsReview,
    sourceStatus: clean(state),
    imageUrl: "",
  };
}

function at(row: string[], column: number): string {
  return clean(row[column]);
}

function isNumber(value: string): boolean {
  return number(value) !== null;
}

function parseInventoryCatalog(sheets: Record<SheetKey, string[][]>): InventoryItem[] {
  const items: InventoryItem[] = [];
  const push = (item: InventoryItem | null) => { if (item) items.push(item); };

  // Power tools: out-of-lab items cannot be checked out until returned.
  sheets.powerTools.forEach((row, index) => {
    if (index < 3 || !isNumber(at(row, 1))) return;
    const total = number(at(row, 3));
    const availability = at(row, 10);
    const issued = Number(at(row, 11).match(/(\d+)/)?.[1] ?? 0);
    const available = availability.toLowerCase() === "out-lab" ? 0 : Math.max(0, (total ?? 0) - issued);
    push(makeItem("Power tools", index + 1, at(row, 1), at(row, 2), at(row, 4), at(row, 6), at(row, 7), total, available, true, total === null, availability));
  });

  // Consumables need an initial physical count before borrowing.
  sheets.consumables.forEach((row, index) => {
    const name = at(row, 4);
    if (index < 4 || !name || ["consumable", "machine name"].includes(name.toLowerCase())) return;
    const spec = at(row, 6);
    push(makeItem("Power tools Consumables", index + 1, at(row, 1), name,
      `For ${at(row, 2)}${spec ? ` · ${spec}` : ""}`, at(row, 3) || spec, at(row, 7), 0, 0, true, true, "Stock count required"));
  });

  // Fixed machinery is visible in the inventory but not borrowable.
  sheets.machinery.forEach((row, index) => {
    if (index < 3 || !isNumber(at(row, 1))) return;
    const total = number(at(row, 7));
    const model = [at(row, 3), at(row, 4), at(row, 6)].filter(Boolean).join(" ");
    push(makeItem("Macheneries", index + 1, at(row, 1), at(row, 2), at(row, 8), model, at(row, 5), total, 0, false, false, at(row, 9)));
  });

  // Electrical and electronics equipment tracks issued and in-stock counts separately.
  sheets.electrical.forEach((row, index) => {
    if (index < 4 || !isNumber(at(row, 1))) return;
    const out = number(at(row, 3));
    const inside = number(at(row, 4));
    push(makeItem("Electrical and Electronics", index + 1, at(row, 1), at(row, 2), at(row, 6), at(row, 5), at(row, 8), (out ?? 0) + (inside ?? 0), inside, true, out === null && inside === null, at(row, 10)));
  });

  sheets.components.forEach((row, index) => {
    const name = at(row, 1);
    const quantity = number(at(row, 2));
    if (index < 1 || !name) return;
    push(makeItem("Electrical and Electronics Comp", index + 1, at(row, 0), name,
      `${at(row, 3)}${at(row, 4) ? ` · ${at(row, 4)}` : ""}`, "", "", quantity, quantity,
      true, quantity === null, quantity ? "In stock" : "Out of stock"));
  });

  for (const [sheetKey, sheetName, startIndex] of [
    ["handTools", "Hand tool 2.0", 6],
    ["measurement", "Measurement Tools", 2],
  ] as const) {
    sheets[sheetKey].forEach((row, index) => {
      if (index < startIndex || !isNumber(at(row, 1))) return;
      const out = number(at(row, 3));
      const inside = number(at(row, 4));
      const condition = at(row, 5);
      const needsRepair = /damaged|reparable/i.test(condition);
      push(makeItem(sheetName, index + 1, at(row, 1), at(row, 2), condition, at(row, 7), at(row, 8), (out ?? 0) + (inside ?? 0), needsRepair ? 0 : inside,
        true, out === null && inside === null, at(row, 9)));
    });
  }

  sheets.safety.forEach((row, index) => {
    if (index < 2 || !isNumber(at(row, 1))) return;
    const outRaw = at(row, 3);
    const insideRaw = at(row, 4);
    const out = number(outRaw);
    const inside = number(insideRaw);
    const ambiguous = Boolean((outRaw && out === null) || (insideRaw && inside === null));
    push(makeItem("Safety Equipment", index + 1, at(row, 1), at(row, 2), at(row, 8), at(row, 6), at(row, 7), (out ?? 0) + (inside ?? 0), inside,
      true, ambiguous || (out === null && inside === null), ambiguous ? "Stock count required" : ""));
  });

  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.itemId)) item.itemId = `${item.itemId}-${item.sourceRow}`;
    seen.add(item.itemId);
  }
  return items;
}

function parseEquipmentMaster(rows: string[][], knownIds: Map<number, string>): LiveEquipmentMaster[] {
  const records: LiveEquipmentMaster[] = [];
  rows.forEach((row, index) => {
    if (index < 3 || !isNumber(at(row, 1))) return;
    const srNo = number(at(row, 1)) ?? undefined;
    const name = at(row, 2);
    if (!name) return;
    const manufacturer = at(row, 3);
    const model = at(row, 4);
    const equipmentId = (srNo && knownIds.get(srNo)) || slug([name, manufacturer, model].filter(Boolean).join(" "));
    const quantity = number(at(row, 7));
    const detailsUrl = at(row, 5);
    records.push({
      equipmentId,
      ...(srNo ? { srNo } : {}),
      name,
      ...(manufacturer ? { manufacturer } : {}),
      ...(model ? { model } : {}),
      ...(detailsUrl ? { detailsUrl } : {}),
      ...(at(row, 6) ? { type: at(row, 6) } : {}),
      ...(quantity !== null ? { quantity } : {}),
      ...(at(row, 8) ? { description: at(row, 8) } : {}),
      ...(at(row, 10) ? { maintenancePartner: at(row, 10) } : {}),
      ...(at(row, 11) ? { contact: at(row, 11) } : {}),
      currentStatus: at(row, 9) || "Status not listed in source",
    });
  });
  if (!records.length) throw new Error("No valid machinery rows were found in the live Google Sheet.");
  return records;
}

async function readSheets(keys: SheetKey[]): Promise<Partial<Record<SheetKey, string[][]>>> {
  const entries = await Promise.all(keys.map(async (key) => [key, await readSheet(key)] as const));
  return Object.fromEntries(entries);
}

export async function readLiveMachinery(knownIds: Map<number, string>): Promise<LiveEquipmentMaster[]> {
  const rows = await readSheet("machinery");
  return parseEquipmentMaster(rows, knownIds);
}

export async function readLiveInventory(): Promise<InventoryItem[]> {
  const keys = Object.keys(SHEET_GIDS) as SheetKey[];
  const raw = await readSheets(keys);
  const rows = raw as Record<SheetKey, string[][]>;
  const items = parseInventoryCatalog(rows);
  if (items.length < 100) throw new Error(`Only ${items.length} inventory rows were parsed; refusing incomplete live data.`);
  return items;
}
