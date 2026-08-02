"use client";

import { useRef, useState } from "react";
import Image from "next/image";

/**
 * One large image with a thumbnail row under it.
 *
 * Deliberately not a lightbox. There is no modal, no overlay and no zoom, and
 * clicking the main image does nothing — nothing on this site needs full-screen
 * inspection, and a modal would be more code than the gallery it wraps.
 *
 * Every image stays mounted as its own layer. That is what makes the cross-fade
 * possible without a flash: the incoming image has already decoded by the time
 * it is promoted.
 */

type GalleryImage = {
  src: string;
  alt: string;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  /** `compact` is the version that sits inside an expanded facility row. */
  size?: "full" | "compact";
  /** Only true on detail pages, where the main image is the LCP element. */
  priority?: boolean;
};

const THUMB = {
  full: "size-14 md:size-18",
  compact: "size-14",
} as const;

const MAIN = {
  full: "",
  /* Capped so the gallery does not grow to fill a wide panel column. */
  compact: "max-w-lg",
} as const;

export function ImageGallery({
  images,
  size = "full",
  priority = false,
}: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  /**
   * The layer that is fading out. It scales up and away while the incoming one
   * scales in, which is what separates a cross-fade from a dissolve.
   */
  const [previous, setPrevious] = useState<number | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (images.length === 0) return null;

  const select = (index: number) => {
    if (index === active) return;
    setPrevious(active);
    setActive(index);
  };

  const move = (delta: number) => {
    const next = (active + delta + images.length) % images.length;
    select(next);
    thumbRefs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
  };

  const single = images.length === 1;

  return (
    <div className={MAIN[size]}>
      <div className="card-chamfer relative aspect-4/3 w-full overflow-hidden bg-primary-tint">
        {images.map((image, index) => {
          const isActive = index === active;
          const isLeaving = index === previous && !isActive;

          return (
            <Image
              key={image.src}
              src={image.src}
              alt={isActive ? image.alt : ""}
              /* Only the active layer is described. Announcing five alt texts
                 for one visible image is worse than announcing none. */
              aria-hidden={!isActive}
              fill
              priority={priority && index === 0}
              sizes={
                size === "compact"
                  ? "(min-width: 48rem) 32rem, 90vw"
                  : "(min-width: 64rem) 60vw, 90vw"
              }
              className={[
                "object-cover transition-[opacity,scale] duration-300 ease-out",
                isActive
                  ? "opacity-100 motion-safe:scale-100"
                  : "opacity-0 " +
                    (isLeaving
                      ? "motion-safe:scale-[1.02]"
                      : "motion-safe:scale-[0.98]"),
              ].join(" ")}
            />
          );
        })}
      </div>

      {/* Says which image is showing — the swap is silent otherwise. */}
      {!single && (
        <p aria-live="polite" className="sr-only">
          Image {active + 1} of {images.length}
        </p>
      )}

      {!single && (
        <div
          role="group"
          aria-label="Image thumbnails"
          onKeyDown={onKeyDown}
          /* Snapping keeps a partly-scrolled thumb from sitting half cut off.
             No arrows: the row is short and drag-scrolls fine. */
          className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
        >
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              ref={(node) => {
                thumbRefs.current[index] = node;
              }}
              onClick={() => select(index)}
              aria-current={index === active ? "true" : undefined}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              /* Roving tab index: the group is one tab stop and the arrow keys
                 move inside it, rather than every thumbnail sitting in the
                 page's tab order. */
              tabIndex={index === active ? 0 : -1}
              className={[
                "relative shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-opacity",
                THUMB[size],
                index === active
                  ? "border-accent opacity-100"
                  : "border-transparent opacity-65 hover:opacity-100",
              ].join(" ")}
            >
              <Image
                src={image.src}
                alt=""
                aria-hidden="true"
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
