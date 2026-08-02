import type { Facility } from "@/types";

/** PLACEHOLDER DATA — replace with the real equipment catalogue in Phase 5. */
export const facilities: Facility[] = [
  {
    slug: "laser-cutter",
    name: "Laser Cutter",
    category: "Fabrication",
    shortDescription:
      "CO2 laser for cutting and engraving acrylic, plywood, MDF, card, and fabric.",
    description:
      "Placeholder description. A CO2 laser cutter suited to rapid prototyping of flat parts, enclosures, press-fit assemblies, and signage. Jobs are submitted as vector files and run under supervision until you are inducted.",
    specs: [
      { label: "Bed size", value: "900 × 600 mm" },
      { label: "Tube power", value: "100 W" },
      { label: "Max material thickness", value: "12 mm acrylic" },
      { label: "File format", value: "SVG, DXF" },
    ],
    safetyNotes: [
      "Never cut PVC, vinyl, or any chlorinated plastic.",
      "The machine is never left running unattended.",
      "Extraction must be on before a job starts.",
    ],
    images: [
      "/images/facilities/laser-cutter.jpg",
      "/images/facilities/laser-cutter-2.jpg",
      "/images/facilities/laser-cutter-3.jpg",
    ],
    requiresTraining: true,
  },
  {
    slug: "3d-printing",
    name: "3D Printing Bay",
    category: "Fabrication",
    shortDescription:
      "A bank of FDM printers plus one resin printer for fine-detail parts.",
    description:
      "Placeholder description. Suited to functional prototypes, jigs, and fixtures. Bring a sliced file or use the bay workstation to prepare one.",
    specs: [
      { label: "FDM printers", value: "6 units" },
      { label: "Build volume", value: "250 × 210 × 220 mm" },
      { label: "Materials", value: "PLA, PETG, TPU" },
      { label: "Resin printer", value: "1 unit, 143 × 89 × 175 mm" },
    ],
    safetyNotes: [
      "Resin is handled with gloves and only inside the fume enclosure.",
      "Do not open a printer mid-job.",
    ],
    images: [
      "/images/facilities/3d-printing.jpg",
      "/images/facilities/3d-printing-2.jpg",
      "/images/facilities/3d-printing-3.jpg",
    ],
    requiresTraining: false,
  },
  {
    slug: "cnc-router",
    name: "CNC Router",
    category: "Fabrication",
    shortDescription:
      "3-axis router for sheet goods, soft metals, and machinable foam.",
    description:
      "Placeholder description. Used for furniture-scale parts, moulds, and structural components. Induction and a signed job sheet are mandatory before use.",
    specs: [
      { label: "Work area", value: "1200 × 1200 mm" },
      { label: "Spindle", value: "2.2 kW" },
      { label: "Axes", value: "3" },
      { label: "Materials", value: "Plywood, MDF, aluminium, foam" },
    ],
    safetyNotes: [
      "Eye and ear protection required inside the bay.",
      "Workholding is checked by staff before every run.",
    ],
    images: [
      "/images/facilities/cnc-router.jpg",
      "/images/facilities/cnc-router-2.jpg",
      "/images/facilities/cnc-router-3.jpg",
    ],
    requiresTraining: true,
  },
  {
    slug: "electronics-bench",
    name: "Electronics Bench",
    category: "Electronics",
    shortDescription:
      "Soldering stations, bench supplies, scopes, and a components library.",
    description:
      "Placeholder description. Open access during lab hours. Everything from a first blinking LED to multi-layer board bring-up happens here.",
    specs: [
      { label: "Stations", value: "8" },
      { label: "Oscilloscopes", value: "4 × 100 MHz" },
      { label: "Bench supplies", value: "8 × 30 V / 5 A" },
      { label: "Rework", value: "Hot air + microscope" },
    ],
    safetyNotes: ["Fume extraction on while soldering."],
    images: [
      "/images/facilities/electronics-bench.jpg",
      "/images/facilities/electronics-bench-2.jpg",
      "/images/facilities/electronics-bench-3.jpg",
    ],
    requiresTraining: false,
  },
  {
    slug: "woodworking-shop",
    name: "Woodworking Shop",
    category: "Workshop",
    shortDescription:
      "Table saw, bandsaw, planer, and a full set of hand tools.",
    description:
      "Placeholder description. For structural work, enclosures, and anything that needs to hold weight. Supervised access only.",
    specs: [
      { label: "Table saw", value: "1 unit" },
      { label: "Bandsaw", value: "2 units" },
      { label: "Planer / thicknesser", value: "1 unit" },
      { label: "Dust extraction", value: "Centralised" },
    ],
    safetyNotes: [
      "No loose clothing, no gloves near rotating blades.",
      "A staff member must be present in the shop.",
    ],
    images: [
      "/images/facilities/woodworking-shop.jpg",
      "/images/facilities/woodworking-shop-2.jpg",
      "/images/facilities/woodworking-shop-3.jpg",
    ],
    requiresTraining: true,
  },
];

export function getFacility(slug: string): Facility | undefined {
  return facilities.find((facility) => facility.slug === slug);
}

export const facilitySlugs = facilities.map((facility) => facility.slug);
