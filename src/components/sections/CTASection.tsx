import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/sections/Section";

/**
 * The closing block on a page. Dark, so it anchors the bottom of the scroll,
 * and carries the PageHero cut on one corner so the machined motif bookends
 * the page.
 */

type CTASectionProps = {
  title: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
};

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
}: CTASectionProps) {
  return (
    <Section tone="dark">
      {/* The chamfer sits on this inner block rather than the band: cutting the
          full-bleed band would leave a wedge of the page background showing
          through at the top right. */}
      <div className="block-chamfer bg-primary-mid/25 p-8 md:p-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="section-title">{title}</h2>
            <p className="section-lede mt-3 text-body">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* One of the few lime moments on the page. */}
            <Button asChild size="lg" variant="accent">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
            {secondaryAction && (
              <Button asChild size="lg" variant="outline">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
