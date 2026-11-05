import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Section } from "@/components/sections/Section";
import { SectionHeader } from "@/components/sections/SectionHeader";

type WorkshopShowcaseProps = {
  title: string;
  description: string;
  poster: StaticImageData;
  photos: { src: StaticImageData; alt: string }[];
};

export function WorkshopShowcase({
  title,
  description,
  poster,
  photos,
}: WorkshopShowcaseProps) {
  return (
    <>
      <Section tone="default">
        <Breadcrumb
          trail={[{ label: "Workshops", href: "/workshops" }]}
          current={title}
        />
        <div className="mt-8">
          <p className="eyebrow">Workshop</p>
          <h1 className="section-title mt-2">{title}</h1>
          <p className="mt-4 max-w-prose text-body text-muted">
            {description}
          </p>
          <div className="mt-8 flex justify-center rounded-lg bg-primary-tint p-3 sm:p-6">
            <Image
              src={poster}
              alt={`${title} main poster`}
              sizes="(min-width: 64rem) 60vw, 90vw"
              className="h-auto max-h-[75vh] w-auto max-w-full object-contain"
              priority
            />
          </div>
        </div>
      </Section>

      {photos.length > 0 && (
        <Section tone="tint" ariaLabelledBy="workshop-gallery">
          <SectionHeader
            id="workshop-gallery"
            title={`${title} photos`}
            className="mb-8"
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <li
                key={photo.alt}
                className="relative aspect-[4/3] overflow-hidden rounded-lg bg-primary-tint"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section tone="default">
        <Link
          href="/workshops"
          className="hover-underline text-small font-medium text-primary"
        >
          Back to workshops
        </Link>
      </Section>
    </>
  );
}
