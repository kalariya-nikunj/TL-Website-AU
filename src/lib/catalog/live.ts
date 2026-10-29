import "server-only";

import type { InventoryItem } from "@/types/inventory";
import fallbackInventory from "../../../scripts/inventory-catalog.json";
import fallbackEquipment from "../../../scripts/equipment-master.json";
import { readLiveInventory, readLiveMachinery, type LiveEquipmentMaster } from "@/lib/catalog/google-sheets";

export type { LiveEquipmentMaster } from "@/lib/catalog/google-sheets";

const inventoryFallback = fallbackInventory as InventoryItem[];
const equipmentFallback = fallbackEquipment as LiveEquipmentMaster[];
const equipmentIdsBySrNo = new Map(equipmentFallback.map((item) => [item.srNo ?? 0, item.equipmentId]));

export async function getInventoryCatalog(): Promise<InventoryItem[]> {
  try {
    return await readLiveInventory();
  } catch (error) {
    console.error("Live Google inventory read failed; using the bundled catalog.", error instanceof Error ? error.name : "Error");
    return inventoryFallback;
  }
}

export async function getEquipmentMaster(): Promise<LiveEquipmentMaster[]> {
  try {
    return await readLiveMachinery(equipmentIdsBySrNo);
  } catch (error) {
    console.error("Live Google machinery read failed; using the bundled catalog.", error instanceof Error ? error.name : "Error");
    return equipmentFallback;
  }
}

export async function getLiveMachineryRecord(equipmentId: string): Promise<LiveEquipmentMaster | undefined> {
  const catalog = await getEquipmentMaster();
  return catalog.find((item) => item.equipmentId === equipmentId);
}
