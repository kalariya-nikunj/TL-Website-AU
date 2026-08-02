import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The heading block at the top of a band.
 *
 * Carries no colours of its own — `section-title` and `section-lede` read the
 * tone set by the surrounding Section, so the same header works on bone, tint
 * and maroon without a variant prop.
 */

type SectionHeaderProps = {
  title: string;
  description?: string;
  /** Optional label above the title. */
  eyebrow?: string;
  /** Anchor id so the parent <Section /> can label its region. */
  id?: string;
  /** The "see everything" button, top right. */
  action?: { label: string; href: string };
  /** `h1` on a page header, `h2` for a band inside a page. */
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  id,
  action,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        /* Top-aligned on desktop so a two-line title does not drag the button
           down with it; wraps under the title on mobile. */
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}

        <Heading id={id} className="section-title">
          {title}
        </Heading>

        {description && (
          <p className="section-lede mt-3 text-body">{description}</p>
        )}
      </div>

      {action && (
        <Button asChild size="lg" variant="outline" className="shrink-0">
          <Link href={action.href}>
            {action.label}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
