"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * The top of every interior page: a machined-looking image cutout bleeding off
 * the left edge, with the page title beside it.
 *
 * Hovering, focusing or tapping the panel cross-fades to a second image and
 * re-cuts the shape. Only `opacity`, `scale` and `clip-path` ever animate —
 * the layout never moves.
 *
 * The geometry lives in `globals.css` as `machined-cut` (`--cut` and
 * `--cut-active`); nothing here knows the polygon.
 */

type PageHeroProps = {
  title: string;
  subtitle?: string;
  /** Shown at rest. Treated as the LCP element. */
  imageDefault: string;
  /** Cross-faded in on hover/focus/tap. Decorative — never given alt text. */
  imageHover: string;
  eyebrow?: string;
  /**
   * Describes `imageDefault`. Not in the original prop list, but the panel is
   * real content on the page, so it cannot ship with an empty alt.
   */
  imageAlt?: string;
};

/** Cross-fade, re-cut and scale all share one duration. */
const DURATION = "duration-400";

const SIZES = "(min-width: 64rem) 45vw, 100vw";

export function PageHero({
  title,
  subtitle,
  imageDefault,
  imageHover,
  eyebrow,
  imageAlt,
}: PageHeroProps) {
  const [active, setActive] = useState(false);
  /**
   * Touch and pointer behave differently enough to need separate handling, and
   * a media query is the only honest way to tell them apart — a user-agent
   * string says nothing about the input device actually in use.
   */
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(pointer.matches);

    sync();
    pointer.addEventListener("change", sync);
    return () => pointer.removeEventListener("change", sync);
  }, []);

  /* On a touch screen a tap fires focus *and* click. Letting focus set the
     state as well would immediately cancel the toggle, so coarse pointers go
     through the click path alone. */
  const hoverProps = coarse
    ? {}
    : {
        onPointerEnter: () => setActive(true),
        onPointerLeave: () => setActive(false),
        onFocus: () => setActive(true),
        onBlur: () => setActive(false),
      };

  return (
    <section className="bg-background">
      <div className="grid lg:min-h-[80dvh] lg:grid-cols-[45fr_55fr]">
        {/* Text first in the DOM: it is the page heading, and it is what a
            phone should meet first. `order` moves it right on desktop. */}
        <div className="order-1 flex flex-col justify-center px-4 pt-12 pb-10 sm:px-6 lg:order-2 lg:px-12 lg:py-24 xl:px-16">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}

          <h1
            className={
              "font-display text-page-hero text-primary" + (eyebrow ? " mt-4" : "")
            }
          >
            {title}
          </h1>

          {subtitle && (
            <p className="mt-6 max-w-[48ch] text-body text-muted">{subtitle}</p>
          )}
        </div>

        {/*
          The focus ring lives out here, on an element with no clip-path and no
          overflow, because an outline drawn on the clipped box would be sliced
          away by the very notch it needs to surround.
        */}
        <div
          className="order-2 h-[50dvh] lg:order-1 lg:h-auto"
          tabIndex={0}
          onClick={coarse ? () => setActive((on) => !on) : undefined}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            setActive((on) => !on);
          }}
          {...hoverProps}
        >
          <div
            data-active={active}
            className="group machined-cut relative h-full overflow-hidden"
          >
            <Image
              src={imageDefault}
              alt={imageAlt ?? title}
              fill
              priority
              sizes={SIZES}
              className={`object-cover transition-[scale] ${DURATION} ease-out motion-safe:group-data-[active=true]:scale-[1.04]`}
            />

            <Image
              src={imageHover}
              alt=""
              aria-hidden="true"
              fill
              sizes={SIZES}
              className={`object-cover opacity-0 transition-[opacity,scale] ${DURATION} ease-out group-data-[active=true]:opacity-100 motion-safe:group-data-[active=true]:scale-[1.04]`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
