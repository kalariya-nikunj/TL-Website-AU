import { getInventoryCatalog } from "@/lib/catalog/live";
import type { InventoryItem } from "@/types/inventory";
import type { Facility } from "@/types";

export const machineryImageById: Record<string, string> = {
  "macheneries-3d-printer-bambu-lab-x1-c-fdm-printer": "/images/home-machineries/3d-printer-bambu-x1c.png",
  "macheneries-3d-printer-creality-ender-3v3-fdm-printer": "/images/home-machineries/3d-printer-ender-3v3.webp",
  "macheneries-resin-3d-printer-phrozen-sonic-mighty-12k-sla-printer": "/images/home-machineries/resin-3d-printer-phrozen-12k.jpg",
  "macheneries-3d-scaner-creality-cr-scan-lizard-scaner": "/images/home-machineries/3d-scanner-creality-lizard.png",
  "macheneries-vinile-cutter-cricut-cricut-maker-3-cutter": "/images/home-machineries/vinyl-cutter-cricut-maker-3.jpg",
  "macheneries-co2-laser-cutter-succes-stl43-co2": "/images/home-machineries/co2-laser-cutter-succes-stl43.jpg",
  "macheneries-acrylic-bending-machin-abm700-1300": "/images/home-machineries/acrylic-bending-machine.jpg",
  "macheneries-wired-thermocutter-proxxon-thermocut-230-e-wire-thermocuter": "/images/home-machineries/wired-thermocutter-proxxon.png",
  "macheneries-sewing-machine-singer-4423-sewing-machine": "/images/home-machineries/sewing-machine-singer-4423.jpg",
  "macheneries-muffle-furnace-surya-s-900-metal-melting": "/images/home-machineries/muffle-furnace-surya-s900.jpg",
  "macheneries-lathe-machine-esskey-kl-2": "/images/home-machineries/lathe-machine-esskey-kl2.png",
  "macheneries-manual-sheet-bender-esskey": "/images/home-machineries/manual-sheet-bender.jpg",
  "macheneries-cnc-milling-machine-made-in-tl-au": "/images/home-machineries/cnc-milling-machine.jpg",
  "macheneries-hardness-testing-machine-insize-hdt-mve1300": "/images/home-machineries/hardness-testing-machine-insize.webp",
  "macheneries-air-compresser-kpt-kc030l": "/images/home-machineries/air-compressor-kpt-kc030l.webp",
};

export const machineryDisplayName: Record<string, string> = {
  "macheneries-3d-scaner-creality-cr-scan-lizard-scaner": "3D Scanner",
  "macheneries-vinile-cutter-cricut-cricut-maker-3-cutter": "Vinyl Cutter",
  "macheneries-acrylic-bending-machin-abm700-1300": "Acrylic Bending Machine",
  "macheneries-air-compresser-kpt-kc030l": "Air Compressor",
};

/** Exact machine-detail routes for machinery inventory rows. */
export const machineryEquipmentIdByItemId: Record<string, string> = {
  "macheneries-3d-printer-bambu-lab-x1-c-fdm-printer": "bambu-lab-x1c",
  "macheneries-3d-printer-creality-ender-3v3-fdm-printer": "creality-ender-3-v3",
  "macheneries-resin-3d-printer-phrozen-sonic-mighty-12k-sla-printer": "phrozen-sonic-mighty-12k",
  "macheneries-3d-scaner-creality-cr-scan-lizard-scaner": "creality-cr-scan-lizard",
  "macheneries-vinile-cutter-cricut-cricut-maker-3-cutter": "cricut-maker-3",
  "macheneries-co2-laser-cutter-succes-stl43-co2": "succes-stl43-co2-laser",
  "macheneries-acrylic-bending-machin-abm700-1300": "acrylic-bending-abm700-1300",
  "macheneries-wired-thermocutter-proxxon-thermocut-230-e-wire-thermocuter": "proxxon-thermocut-230e",
  "macheneries-sewing-machine-singer-4423-sewing-machine": "singer-4423",
  "macheneries-muffle-furnace-surya-s-900-metal-melting": "surya-s900-muffle-furnace",
  "macheneries-lathe-machine-esskey-kl-2": "esskey-kl2-lathe",
  "macheneries-manual-sheet-bender-esskey": "esskey-manual-sheet-bender",
  "macheneries-cnc-milling-machine-made-in-tl-au": "cnc-milling-machine",
  "macheneries-hardness-testing-machine-insize-hdt-mve1300": "insize-hdt-mve1300",
  "macheneries-air-compresser-kpt-kc030l": "kpt-kc030l-air-compressor",
};

export async function getMachineryCatalog(): Promise<InventoryItem[]> {
  return (await getInventoryCatalog()).filter((item) => item.sourceSheet === "Macheneries");
}

export function toMachineryFacilities(items: InventoryItem[]): Facility[] {
  return items.map((item) => {
    const model = item.description.replace(/^Consumable Link\s*[·-]\s*/i, "");
    const name = machineryDisplayName[item.itemId] ?? item.name;
    return {
      slug: `inventory-${item.itemId}`,
      ...(machineryEquipmentIdByItemId[item.itemId]
        ? { equipmentId: machineryEquipmentIdByItemId[item.itemId] }
        : {}),
      name,
      category: item.category,
      shortDescription: model || "Machine listed in the Tinkerers Lab inventory.",
      description: model
        ? `${name} · ${model}`
        : `${name}, listed in the Tinkerers Lab machinery inventory.`,
      specs: [
        ...(model ? [{ label: "Make / Model", value: model }] : []),
        { label: "Quantity", value: String(item.totalQuantity) },
        ...(item.sourceStatus ? [{ label: "Current status", value: item.sourceStatus }] : []),
      ],
      images: [machineryImageById[item.itemId] ?? "/images/hero/facilities-a.jpg"],
      requiresTraining: false,
      catalogOnly: true,
      ...(item.detailsUrl ? { detailsUrl: item.detailsUrl } : {}),
    };
  });
}
