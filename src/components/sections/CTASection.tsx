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
    <section className="border-t bg-muted/40 py-12 md:py-16">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-heading text-2xl font-semibold md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
          {secondaryAction && (
            <Button asChild variant="outline">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </Container>
    </section>
  );
}
