import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { RegistrationForm } from "@/components/forms/RegistrationForm";
import { ImagePlaceholder } from "@/components/media/ImagePlaceholder";
import { PageHeader } from "@/components/sections/PageHeader";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { eventSlugs, getEvent } from "@/content/events";
import { formatEventRange } from "@/lib/format";

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
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <>
      <PageHeader
        eyebrow={formatEventRange(event.startsAt, event.endsAt)}
        title={event.title}
        description={event.shortDescription}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant={event.registrationOpen ? "default" : "secondary"}>
            {event.registrationOpen ? "Registration open" : "No booking needed"}
          </Badge>
          {typeof event.capacity === "number" && (
            <Badge variant="outline">{event.capacity} places</Badge>
          )}
          <Badge variant="outline">{event.location}</Badge>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <ImagePlaceholder
              label={event.title}
              className="w-full rounded-lg"
            />
            <div className="mt-8 max-w-2xl text-muted">
              <p>{event.description}</p>
            </div>
          </div>

          <dl className="flex h-fit flex-col gap-4 rounded-lg border bg-surface p-6 text-small">
            <div>
              <dt className="font-medium">When</dt>
              <dd className="mt-1 text-muted">
                {formatEventRange(event.startsAt, event.endsAt)}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Where</dt>
              <dd className="mt-1 text-muted">{event.location}</dd>
            </div>
            {typeof event.capacity === "number" && (
              <div>
                <dt className="font-medium">Capacity</dt>
                <dd className="mt-1 text-muted">
                  {event.capacity} students
                </dd>
              </div>
            )}
            <div>
              <dt className="font-medium">Cost</dt>
              <dd className="mt-1 text-muted">Free</dd>
            </div>
          </dl>
        </div>
      </Section>

      <Section ariaLabelledBy="register">
        <SectionHeader
          id="register"
          title={event.registrationOpen ? "Register" : "Just turn up"}
          description={
            event.registrationOpen
              ? "Places are limited and allocated in order of registration."
              : "This event is drop-in — no registration required."
          }
        />
        <div className="mt-8">
          {event.registrationOpen ? (
            <RegistrationForm eventSlug={event.slug} eventTitle={event.title} />
          ) : (
            <p className="text-muted">
              See the <Link href="/help">help page</Link> for directions to the
              lab.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
