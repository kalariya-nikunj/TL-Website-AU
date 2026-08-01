import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";

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
    <section className="border-t border-border bg-primary-tint py-14 md:py-20">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-h2 text-primary-dark">{title}</h2>
          <p className="mt-3 text-body text-muted">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* The page's closing CTA — one of the few lime moments. */}
          <Button asChild size="lg" variant="accent">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
          {secondaryAction && (
            <Button asChild size="lg" variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
