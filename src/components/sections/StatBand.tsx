import { Section } from "@/components/sections/Section";
import type { Stat } from "@/types";

/**
 * Four figures on a dark band.
 *
 * No count-up, no reveal. These are a spec plate — the kind of thing you read
 * once and trust. Animating them would make them feel like a dashboard, and a
 * number that animates on scroll is a number nobody can quote.
 */

type StatBandProps = {
  stats: readonly Stat[];
  ariaLabel?: string;
};

export function StatBand({ stats, ariaLabel = "The lab in numbers" }: StatBandProps) {
  return (
    <Section tone="dark" size="compact">
      <dl
        aria-label={ariaLabel}
        className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4"
      >
        {stats.map((stat) => (
          /* Term before definition in the DOM, figure above label on screen —
             `flex-col-reverse` gets both without duplicating the text. */
          <div key={stat.label} className="flex flex-col-reverse gap-2">
            <dt className="text-small text-background/80">{stat.label}</dt>
            <dd className="font-display text-stat text-accent">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
