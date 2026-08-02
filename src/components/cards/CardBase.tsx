import Link from "next/link";
import Image from "next/image";

/**
 * The shell every card on the site is built from.
 *
 * One portrait image, a gradient scrim, and the content sitting on top of it —
 * so a card never depends on the photo behind it being dark enough to read
 * against. Sizing is the parent's job: the rail fixes a width on the `<li>`,
 * the grid lets the column decide.
 *
 * The whole card is one link. Nothing inside it may be focusable or the
 * accessible name splits in two.
 */

/**
 * Cards top out at `--card-w` (22rem) on the rail and at roughly the same in a
 * three-column grid, so one descriptor covers both layouts.
 */
const SIZES = "(min-width: 48rem) 22rem, 90vw";

type CardBaseProps = {
  href: string;
  image: string;
  /** Describes the photo. The card title is not repeated here. */
  imageAlt: string;
  /** Pinned top-left. Kept to a word or two — it is a pill, not a sentence. */
  badge?: React.ReactNode;
  title: string;
  /** One line under the title. Clamped, so it can be prose. */
  meta?: React.ReactNode;
  /** Icons and short values. Laid out as a wrapping row. */
  specs?: React.ReactNode;
  /** Set on the first card of the homepage rail and nowhere else. */
  priority?: boolean;
};

export function CardBase({
  href,
  image,
  imageAlt,
  badge,
  title,
  meta,
  specs,
  priority = false,
}: CardBaseProps) {
  return (
    /*
      The link carries no clip-path and no overflow of its own: an outline drawn
      on the clipped box would be sliced off at the chamfer, which is exactly
      the corner a focus ring needs to turn.
    */
    <Link href={href} className="group relative block aspect-4/5 w-full">
      <div className="card-chamfer absolute inset-0 overflow-hidden bg-primary-tint">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority={priority}
          sizes={SIZES}
          className="object-cover transition-[scale] duration-400 ease-out motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105"
        />

        {/* Legibility floor. Nothing below this line depends on the photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-transparent from-45% to-primary-dark/96"
        />

        {/*
          Hover deepens the scrim. This is opacity, not a colour change, so it
          is the one hover effect that survives reduced motion — the global rule
          collapses the duration but the state still changes.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-transparent from-25% to-primary-dark opacity-0 transition-opacity duration-400 ease-out group-hover:opacity-55 group-focus-visible:opacity-55"
        />

        {badge && (
          <span className="card-badge absolute top-4 left-4 px-2.5 py-1">
            {badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-6">
          <h3
            data-card-title
            className="line-clamp-2 font-display text-card-title text-background"
          >
            {title}
          </h3>

          {meta && (
            <div className="line-clamp-1 text-small text-background/80">
              {meta}
            </div>
          )}

          {specs && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-background/80">
              {specs}
            </div>
          )}
        </div>

        {/* Lime rule wiping in from the left — the header's underline, moved. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-400 ease-out motion-safe:group-hover:scale-x-100 motion-safe:group-focus-visible:scale-x-100"
        />
      </div>
    </Link>
  );
}
