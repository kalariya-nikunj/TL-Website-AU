import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  /** Anchor id so the parent <Section /> can label its region. */
  id?: string;
  /** Optional "see all" link rendered opposite the title. */
  action?: { label: string; href: string };
  /** `h1` on a page header, `h2` for a band inside a page. */
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeader({
  title,
  description,
  id,
  action,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <Heading
          id={id}
          className={cn(
            "font-display text-primary-dark",
            Heading === "h1" ? "text-h1" : "text-h2",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className="mt-3 text-body text-muted">{description}</p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="hover-underline inline-flex shrink-0 items-center gap-1 text-small font-medium text-primary"
        >
          {action.label}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
