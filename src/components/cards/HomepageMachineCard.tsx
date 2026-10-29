import { CardBase } from "@/components/cards/CardBase";
import type { InventoryItem } from "@/types/inventory";

type HomepageMachineCardProps = {
  item: InventoryItem;
  image: string;
};

const DISPLAY_NAMES: Record<string, string> = {
  "macheneries-3d-scaner-creality-cr-scan-lizard-scaner": "3D Scanner",
  "macheneries-vinile-cutter-cricut-cricut-maker-3-cutter": "Vinyl Cutter",
  "macheneries-acrylic-bending-machin-abm700-1300": "Acrylic Bending Machine",
  "macheneries-air-compresser-kpt-kc030l": "Air Compressor",
};

/** A homepage card for one of the machines listed in the lab inventory. */
export function HomepageMachineCard({ item, image }: HomepageMachineCardProps) {
  const description = item.description.replace(/^Consumable Link\s*[·-]\s*/i, "");
  const name = DISPLAY_NAMES[item.itemId] ?? item.name;

  return (
    <li>
      <CardBase
        href="/facilities"
        image={image}
        imageAlt={`${name}${description ? ` — ${description}` : ""}`}
        badge="Machinery"
        title={name}
        meta={description || item.category}
        specs={
          <>
            <span>Quantity · {item.totalQuantity}</span>
            {item.sourceStatus && <span>{item.sourceStatus}</span>}
          </>
        }
      />
    </li>
  );
}
