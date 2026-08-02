import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlusIcon, ClockIcon, MapPinIcon } from "lucide-react";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import {
  CheckList,
  DetailList,
  SidebarField,
  StatusPill,
} from "@/components/sections/DetailPanels";
import { PersonCredit } from "@/components/cards/PersonCredit";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { eventSlugs, getEvent, getUpcomingEvents } from "@/content/events";
import { getFacility } from "@/content/facilities";
import { getTeamMember } from "@/content/team";
import { site } from "@/content/site";
import { formatDateBlock, formatEventRange, formatTime } from "@/lib/format";
import type { EventLevel } from "@/types";

/** Registration is wired in Phase 4; sign-in is the closest real destination. */
const REGISTER_HREF = "/login";

const LEVEL: Record<EventLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const FALLBACK_IMAGE = "/images/hero/workshops-a.jpg";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return eventSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return {};

  return {
    title: event.title,
    description: event.shortDescription,
    openGraph: {
      title: `${event.title} — ${site.name}`,
      description: event.shortDescription,
      images: [event.image ?? FALLBACK_IMAGE],
    },
  };
}

/** "2 hours 30 minutes", derived from the timestamps rather than hand-typed. */
function duration(startsAt: string, endsAt: string): string {
  const minutes = Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000,
  );
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} minutes`;
  if (rest === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours} ${hours === 1 ? "hour" : "hours"} ${rest} minutes`;
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const date = formatDateBlock(event.startsAt);
  const instructor = event.instructor
    ? getTeamMember(event.instructor)
    : undefined;

  /* Unresolvable slugs drop out rather than rendering a broken link. */
  const machines = (event.facilitiesUsed ?? [])
    .map((facilitySlug) => getFacility(facilitySlug))
    .filter((facility) => facility !== undefined);

  const others = getUpcomingEvents()
    .filter((other) => other.slug !== event.slug)
    .slice(0, 3);

  const taken =
    typeof event.capacity === "number" &&
    typeof event.seatsRemaining === "number"
      ? event.capacity - event.seatsRemaining
      : undefined;

  return (
    <>
      <Section tone="default">
        <Breadcrumb
          trail={[{ label: "Workshops", href: "/workshops" }]}
          current={event.title}
        />

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-16">
          {/* ---------------- Main ---------------- */}
          <div className="flex flex-col gap-10">
            <div>
              <p className="eyebrow">
                {formatEventRange(event.startsAt, event.endsAt)}
              </p>
              <h1 className="section-title mt-2">{event.title}</h1>
              <p className="mt-4 max-w-prose text-body text-muted">
                {event.shortDescription}
              </p>
            </div>

            <div className="card-chamfer relative aspect-video w-full overflow-hidden bg-primary-tint">
              <Image
                src={event.image ?? FALLBACK_IMAGE}
                alt={`${event.title} at the Tinkerer Lab`}
                fill
                priority
                sizes="(min-width: 64rem) 60vw, 90vw"
                className="object-cover"
              />
            </div>

            <p className="max-w-prose text-body text-muted">
              {event.description}
            </p>

            <CheckList
              id="learn"
              title="What you'll learn"
              items={event.whatYouWillLearn}
            />

            <DetailList
              id="bring"
              title="What to bring"
              items={event.whatToBring}
            />

            {/* The one list that says something useful when it is empty. */}
            <section aria-labelledby="prerequisites">
              <h2
                id="prerequisites"
                className="font-display text-h3 text-primary-dark"
              >
                Prerequisites
              </h2>
              {event.prerequisites && event.prerequisites.length > 0 ? (
                <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-body text-muted">
                  {event.prerequisites.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-body text-muted">
                  No prior experience needed.
                </p>
              )}
            </section>

            {machines.length > 0 && (
              <section aria-labelledby="machines">
                <h2
                  id="machines"
                  className="font-display text-h3 text-primary-dark"
                >
                  Machines you&rsquo;ll use
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {machines.map((facility) => (
                    <li key={facility.slug}>
                      <Link
                        href={`/facilities/${facility.slug}`}
                        className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-primary-tint"
                      >
                        <span className="card-chamfer relative size-14 shrink-0 overflow-hidden bg-primary-tint">
                          <Image
                            src={facility.images[0]}
                            alt=""
                            aria-hidden="true"
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-ink transition-colors group-hover:text-primary">
                            {facility.name}
                          </span>
                          <span className="mt-0.5 block truncate text-small text-muted">
                            {facility.shortDescription}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ---------------- Sidebar ---------------- */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
              {/* Same date block as the list rows, so the page reads as the
                  same object you clicked. */}
              <div className="flex items-center gap-5">
                <span className="flex w-16 shrink-0 flex-col items-center text-primary">
                  <span className="text-eyebrow font-display font-semibold uppercase">
                    {date.month}
                  </span>
                  <span className="font-display text-h1 leading-none">
                    {date.day}
                  </span>
                  <span className="mt-1 text-small text-muted">
                    {date.weekday}
                  </span>
                </span>

                <div className="flex min-w-0 flex-col gap-1.5 text-small text-muted">
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="size-4 shrink-0" aria-hidden="true" />
                    {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPinIcon
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    {event.location}
                  </span>
                  <span>{duration(event.startsAt, event.endsAt)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {event.level && (
                  <StatusPill tone="muted">{LEVEL[event.level]}</StatusPill>
                )}
                {event.isInduction && (
                  <StatusPill tone="accent">Unlocks a machine</StatusPill>
                )}
              </div>

              <SidebarField label="Materials fee">
                {event.materialsFee}
              </SidebarField>

              {typeof event.capacity === "number" &&
                typeof taken === "number" && (
                  <div>
                    <p className="eyebrow">Capacity</p>
                    <p className="mt-1.5 text-small text-ink">
                      {taken} of {event.capacity} seats taken
                    </p>
                    {/* The bar repeats the sentence above it, so it is
                        decorative rather than a second thing to interpret. */}
                    <div
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-lg bg-primary-tint"
                    >
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${Math.round((taken / event.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              {event.registrationOpen ? (
                <Button asChild size="lg" variant="accent" className="w-full">
                  <Link href={REGISTER_HREF}>Register</Link>
                </Button>
              ) : (
                <div>
                  <Button size="lg" variant="accent" className="w-full" disabled>
                    Register
                  </Button>
                  <p className="mt-2 text-small text-muted">
                    Registration closed.
                  </p>
                </div>
              )}

              <Link
                href="/workshops#calendar"
                className="hover-underline inline-flex items-center gap-1.5 text-small font-medium text-primary"
              >
                <CalendarPlusIcon className="size-4" aria-hidden="true" />
                Add to calendar
              </Link>
            </div>

            {instructor && (
              <div className="rounded-lg border border-border bg-surface p-6">
                <p className="eyebrow mb-3">Taught by</p>
                <PersonCredit member={instructor} role="Instructor" />
              </div>
            )}
          </aside>
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="tint" ariaLabelledBy="other-events">
          <SectionHeader
            id="other-events"
            title="Other upcoming workshops"
            action={{ label: "See all", href: "/workshops" }}
            className="mb-8"
          />

          <ul className="border-t border-border">
            {others.map((other) => {
              const otherDate = formatDateBlock(other.startsAt);

              return (
                <li key={other.slug}>
                  <Link
                    href={`/workshops/${other.slug}`}
                    className="group relative flex min-h-24 items-center gap-5 border-b border-border py-4 pl-5 transition-colors hover:bg-surface"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute top-0 bottom-0 left-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-250 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
                    />

                    <span className="flex w-14 shrink-0 flex-col items-center text-primary">
                      <span className="text-eyebrow font-display font-semibold uppercase">
                        {otherDate.month}
                      </span>
                      <span className="font-display text-h3 leading-none">
                        {otherDate.day}
                      </span>
                      <span className="mt-0.5 text-small text-muted">
                        {otherDate.weekday.slice(0, 3)}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-card-title text-ink transition-colors group-hover:text-primary">
                        {other.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <ClockIcon
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          {formatTime(other.startsAt)}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <MapPinIcon
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate">{other.location}</span>
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}
