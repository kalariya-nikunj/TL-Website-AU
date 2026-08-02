import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon, MapPinIcon } from "lucide-react";

import { CTASection } from "@/components/sections/CTASection";
import { Container } from "@/components/layout/Container";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { StatBand } from "@/components/sections/StatBand";
import { TeamRail } from "@/components/sections/TeamRail";
import { contact, site, stats } from "@/content/site";
import { team } from "@/content/team";

export const metadata: Metadata = {
  title: "About",
  description: site.description,
};

/**
 * Numbered because it genuinely is a sequence — you cannot book a machine you
 * have not been inducted on. Numbering a list that is not ordered is noise.
 */
const STEPS = [
  {
    title: "Get inducted",
    body: "Book the induction workshop for the machine your project needs. It is free, it takes an afternoon, and it ends with you signed off to use the machine alone.",
    action: { label: "See workshops", href: "/workshops" },
  },
  {
    title: "Book a machine",
    body: "Once you are inducted, the machine is yours to book. Open-access equipment — hand tools, the electronics bench — needs no booking at all.",
    action: { label: "See the facilities", href: "/facilities" },
  },
  {
    title: "Build",
    body: "Come in during open hours and work. Staff are on the floor if something goes wrong, and materials for small parts are stocked.",
    action: { label: "Lab hours", href: "#visit" },
  },
];

const DIRECTIONS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  contact.address.join(", "),
)}`;

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={site.university}
        title="About the lab"
        subtitle={site.description}
        imageDefault="/images/hero/about-a.jpg"
        imageHover="/images/hero/about-b.jpg"
        imageAlt="Students working at the benches in the Tinkerer Lab"
      />

      {/* 2. What the lab is */}
      <Section tone="default" ariaLabelledBy="about-what">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="about-what" className="section-title">
              What the lab is for
            </h2>
            <div className="section-lede mt-4 flex max-w-prose flex-col gap-4 text-body">
              <p>
                Placeholder copy. The lab exists so that a student with an idea
                has somewhere to make it real — not eventually, and not only if
                it is part of a course.
              </p>
              <p>
                Placeholder copy. It brings fabrication, electronics, and
                workshop equipment into one supervised space, with the training
                needed to use each machine safely.
              </p>
            </div>
          </div>

          <div className="card-chamfer relative aspect-4/3 w-full overflow-hidden bg-primary-tint">
            <Image
              src="/images/hero/about-b.jpg"
              alt="The Tinkerer Lab shop floor"
              fill
              sizes="(min-width: 64rem) 45vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      {/* 3. How to use it */}
      <Section tone="tint" ariaLabelledBy="about-how">
        <SectionHeader
          id="about-how"
          title="How to use the lab"
          description="Three steps, in this order, and none of them cost anything."
          className="mb-10"
        />

        <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                aria-hidden="true"
                className="font-display text-stat text-accent-dark"
              >
                {index + 1}
              </span>
              <h3 className="font-display text-h3 text-primary-dark">
                {step.title}
              </h3>
              <p className="text-body text-muted">{step.body}</p>
              <Link
                href={step.action.href}
                className="hover-underline mt-auto inline-flex items-center gap-1 pt-2 text-small font-medium text-primary"
              >
                {step.action.label}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* 4. The numbers */}
      <StatBand stats={stats} />

      {/* 5. Team — `id="team"` is the target of /about#team site-wide. */}
      <Section tone="default" bleed ariaLabelledBy="team">
        <Container>
          <SectionHeader
            id="team"
            title="The team"
            description="Placeholder copy. Staff and student coordinators who run inductions, supervise the shop floor, and maintain the equipment."
            className="mb-8"
          />
        </Container>

        <TeamRail members={team} ariaLabel="The Tinkerer Lab team" />
      </Section>

      {/* 6. Visit us */}
      <Section tone="tint" id="visit" ariaLabelledBy="about-visit">
        <SectionHeader
          id="about-visit"
          title="Visit us"
          description="Walk in during open hours — you do not need an appointment to look around."
          className="mb-10"
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-8">
            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <MapPinIcon className="size-3.5" aria-hidden="true" />
                Address
              </p>
              <address className="mt-3 flex flex-col gap-1 text-body text-muted not-italic">
                {contact.address.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              <Link
                href={DIRECTIONS}
                target="_blank"
                rel="noopener noreferrer"
                className="hover-underline mt-4 inline-flex items-center gap-1 text-small font-medium text-primary"
              >
                Get directions
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <p className="eyebrow flex items-center gap-1.5">
                <ClockIcon className="size-3.5" aria-hidden="true" />
                Opening hours
              </p>
              <dl className="mt-3 flex max-w-sm flex-col gap-2 text-small">
                {contact.hours.map((slot) => (
                  <div
                    key={slot.label}
                    className="flex justify-between gap-6 border-b border-border pb-2"
                  >
                    <dt className="text-muted">{slot.label}</dt>
                    <dd className="text-ink">{slot.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="card-chamfer flex aspect-4/3 w-full items-center justify-center border border-border bg-surface text-small text-muted">
            Map embed — Phase 4
          </div>
        </div>
      </Section>

      <CTASection
        title="Want to work in the lab?"
        description="Start with an induction workshop — they run every few weeks and cost nothing."
        primaryAction={{ label: "See upcoming workshops", href: "/workshops" }}
        secondaryAction={{ label: "Ask a question", href: "/help" }}
      />
    </>
  );
}
