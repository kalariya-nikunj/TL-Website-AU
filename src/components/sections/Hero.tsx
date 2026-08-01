import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { ImagePlaceholder } from "@/components/media/ImagePlaceholder";

type HeroAction = {
  label: string;
  href: string;
};

type HeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  /** Phase 3 swaps this for the rotating slides / video. */
  mediaLabel?: string;
};

export function Hero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  mediaLabel,
}: HeroProps) {
  return (
    /* The signature pairing: lime on primary-dark. */
    /* Extra top padding clears the fixed header, which overlays this section
       rather than sitting above it. */
    <section className="dark-band pt-36 pb-16 md:pt-44 md:pb-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="max-w-2xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-3 font-display text-h1">{title}</h1>
          <p className="mt-5 text-body text-background/75">{description}</p>

          {(primaryAction || secondaryAction) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryAction && (
                <Button asChild size="lg" variant="accent">
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              )}
              {secondaryAction && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                >
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {mediaLabel && (
          <ImagePlaceholder
            label={mediaLabel}
            className="w-full rounded-lg border border-background/15 bg-background/10 text-background/60"
          />
        )}
      </Container>
    </section>
  );
}
