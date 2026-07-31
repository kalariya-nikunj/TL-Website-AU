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
    <section className="border-b py-12 md:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="mt-2 font-heading text-4xl font-semibold md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>

          {(primaryAction || secondaryAction) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryAction && (
                <Button asChild>
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              )}
              {secondaryAction && (
                <Button asChild variant="outline">
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {mediaLabel && (
          <ImagePlaceholder label={mediaLabel} className="w-full rounded-xl" />
        )}
      </Container>
    </section>
  );
}
