import { ShieldAlertIcon } from "lucide-react";

import { CardBase } from "@/components/cards/CardBase";
import type { Facility } from "@/types";

type FacilityCardProps = {
  facility: Facility;
  priority?: boolean;
  imageOverride?: string;
};

export function FacilityCard({ facility, priority, imageOverride }: FacilityCardProps) {
  /* Two is what fits on one row at the card's width — the rest of the specs
     live on the detail page. */
  const specs = facility.specs.slice(0, 2);

  return (
    <li>
      <CardBase
        href={`/facilities/${facility.slug}`}
        image={imageOverride ?? facility.images[0]}
        imageAlt={`${facility.name} in the Tinkerer Lab`}
        badge={facility.category}
        title={facility.name}
        meta={facility.shortDescription}
        priority={priority}
        specs={
          <>
            {specs.map((spec) => (
              <span key={spec.label}>
                {spec.label} · {spec.value}
              </span>
            ))}

            {facility.requiresTraining && (
              <span className="inline-flex items-center gap-1.5 text-accent">
                <ShieldAlertIcon className="size-3.5" aria-hidden="true" />
                Training required
              </span>
            )}
          </>
        }
      />
    </li>
  );
}
