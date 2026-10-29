import sourceInventory from "../../scripts/inventory-catalog.json";

import type { InventoryItem } from "@/types/inventory";

export const machineryItems = (sourceInventory as InventoryItem[]).filter(
  (item) => item.sourceSheet === "Macheneries",
);

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
