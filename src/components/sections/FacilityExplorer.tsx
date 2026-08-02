"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDownIcon, ShieldAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import type { Facility } from "@/types";

/**
 * The facilities catalogue as expandable rows.
 *
 * A machine list is something people scan for one specific machine, so the
 * collapsed row carries only what identifies it. Opening a row is a browsing
 * convenience — it shows a summary and hands off to /facilities/[slug], which
 * remains the canonical page, the indexed one, and the one people share.
 *
 * The panel animates `grid-template-rows` from 0fr to 1fr rather than a
 * measured height, so nothing has to know how tall the content is.
 */

/**
 * Booking is Phase 4. Until it exists the accent button goes where a student
 * can actually reach someone — one constant to repoint when it lands.
 */
const BOOKING_HREF = "/help#contact";

type FacilityExplorerProps = {
  facilities: Facility[];
};

export function FacilityExplorer({ facilities }: FacilityExplorerProps) {
  const baseId = useId();
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  const rowId = (slug: string) => `${baseId}-row-${slug}`;
  const panelId = (slug: string) => `${baseId}-panel-${slug}`;

  /* Escape collapses, and focus comes back to the row that was open — a user
     who tabbed into the panel would otherwise be left on a hidden element. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "Escape" || !openSlug) return;
    event.stopPropagation();
    rowRefs.current.get(openSlug)?.focus();
    setOpenSlug(null);
  };

  return (
    <Container as="section" className="py-12 md:py-16">
      <ul
        onKeyDown={onKeyDown}
        className="border-t border-border"
        aria-label="Lab equipment"
      >
        {facilities.map((facility) => {
          const open = openSlug === facility.slug;
          const image = facility.images[0];

          return (
            <li key={facility.slug} className="border-b border-border">
              <h3>
                <button
                  type="button"
                  id={rowId(facility.slug)}
                  ref={(node) => {
                    if (node) rowRefs.current.set(facility.slug, node);
                    else rowRefs.current.delete(facility.slug);
                  }}
                  aria-expanded={open}
                  aria-controls={panelId(facility.slug)}
                  onClick={() => setOpenSlug(open ? null : facility.slug)}
                  className="group flex min-h-30 w-full items-center gap-5 py-4 text-left transition-colors hover:bg-primary-tint aria-expanded:bg-primary-tint"
                >
                  <span className="card-chamfer relative size-24 shrink-0 overflow-hidden bg-primary-tint">
                    <Image
                      src={image}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block">{facility.category}</span>
                    <span className="mt-1 block font-display text-h3 text-ink transition-colors group-hover:text-primary">
                      {facility.name}
                    </span>
                  </span>

                  {/*
                    Repeated verbatim inside the panel, so it is hidden from
                    assistive tech — otherwise the row's accessible name grows
                    to a paragraph.
                  */}
                  <span
                    aria-hidden="true"
                    className="hidden shrink-0 flex-col items-end gap-1 text-small text-muted md:flex"
                  >
                    {facility.specs.slice(0, 2).map((spec) => (
                      <span key={spec.label}>
                        {spec.label} · {spec.value}
                      </span>
                    ))}
                  </span>

                  <ChevronDownIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted transition-transform duration-300 ease-out group-aria-expanded:rotate-180"
                  />
                </button>
              </h3>

              <div
                id={panelId(facility.slug)}
                role="region"
                aria-labelledby={rowId(facility.slug)}
                style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                className="grid transition-[grid-template-rows] duration-300 ease-out"
              >
                <div className="overflow-hidden">
                  {/* `inert` keeps the collapsed panel out of the tab order and
                      out of the accessibility tree without display:none, which
                      would kill the transition. */}
                  <div
                    inert={!open}
                    className="grid gap-8 pt-2 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]"
                  >
                    <div className="card-chamfer relative aspect-4/3 w-full overflow-hidden bg-primary-tint">
                      <Image
                        src={image}
                        alt={`${facility.name} in the Tinkerer Lab`}
                        fill
                        sizes="(min-width: 48rem) 40vw, 90vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col gap-6">
                      <p className="max-w-prose text-body text-muted">
                        {facility.description}
                      </p>

                      <div>
                        <p className="eyebrow">Specifications</p>
                        <dl className="mt-3 flex flex-col gap-2 text-small">
                          {facility.specs.map((spec) => (
                            <div
                              key={spec.label}
                              className="flex justify-between gap-6 border-b border-border pb-2"
                            >
                              <dt className="text-muted">{spec.label}</dt>
                              <dd className="text-right text-ink">
                                {spec.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      {facility.safetyNotes &&
                        facility.safetyNotes.length > 0 && (
                          <div>
                            <p className="eyebrow inline-flex items-center gap-1.5">
                              <ShieldAlertIcon
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Safety
                            </p>
                            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-small text-muted">
                              {facility.safetyNotes.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      <div className="flex flex-wrap gap-3">
                        {/* The row is a summary; this is the page. */}
                        <Button asChild size="lg" variant="outline">
                          <Link href={`/facilities/${facility.slug}`}>
                            View full details
                          </Link>
                        </Button>
                        <Button asChild size="lg" variant="accent">
                          <Link href={BOOKING_HREF}>Book this machine</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
