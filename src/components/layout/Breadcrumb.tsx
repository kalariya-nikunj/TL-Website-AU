import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import type { NavLink } from "@/types";

/**
 * The trail above a detail page title.
 *
 * The last crumb is the current page, so it is text rather than a link to
 * itself, and carries `aria-current="page"`.
 */

type BreadcrumbProps = {
  /** Ancestors, in order. The current page is passed separately. */
  trail: NavLink[];
  current: string;
};

export function Breadcrumb({ trail, current }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-small text-muted">
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            <Link
              href={crumb.href}
              className="hover-underline transition-colors hover:text-primary"
            >
              {crumb.label}
            </Link>
            <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden="true" />
          </li>
        ))}

        <li>
          <span aria-current="page" className="text-ink">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}
