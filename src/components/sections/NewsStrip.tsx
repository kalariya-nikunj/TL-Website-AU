import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { NewsItem } from "@/types";

/**
 * Three announcements in a row: date, then headline.
 *
 * Carries no background or padding of its own — the Section around it owns
 * both. Returns null when there is nothing to say, so the page can drop the
 * whole band rather than render an empty strip.
 */

type NewsStripProps = {
  items: NewsItem[];
  /** Where "What's on" goes. */
  href?: string;
};

export function NewsStrip({ items, href = "/workshops" }: NewsStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      <ul className="flex flex-col gap-4 lg:flex-1 lg:flex-row lg:items-baseline lg:gap-10">
        {items.slice(0, 3).map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 text-small lg:min-w-0 lg:flex-1"
          >
            <span className="eyebrow">{item.date ?? item.label}</span>

            {item.href ? (
              <Link
                href={item.href}
                className="hover-underline text-ink transition-colors hover:text-primary"
              >
                {item.text}
              </Link>
            ) : (
              <span className="text-muted">{item.text}</span>
            )}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className="hover-underline inline-flex shrink-0 items-center gap-1 text-small font-medium text-primary"
      >
        What&rsquo;s on
        <ArrowRightIcon className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
