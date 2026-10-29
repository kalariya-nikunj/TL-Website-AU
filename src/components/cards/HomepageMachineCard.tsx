import { CardBase } from "@/components/cards/CardBase";
import { machineryDisplayName } from "@/content/machinery";
import type { InventoryItem } from "@/types/inventory";

type HomepageMachineCardProps = {
  item: InventoryItem;
  image: string;
};

/** A homepage card for one of the machines listed in the lab inventory. */
export function HomepageMachineCard({ item, image }: HomepageMachineCardProps) {
  const description = item.description.replace(/^Consumable Link\s*[·-]\s*/i, "");
  const name = machineryDisplayName[item.itemId] ?? item.name;

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
