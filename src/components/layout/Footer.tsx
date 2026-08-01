import Link from "next/link";
import { MailIcon, MapPinIcon } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { CrowdCanvas } from "@/components/layout/CrowdCanvas";
import { SOCIAL_ICONS } from "@/components/layout/SocialIcons";
import {
  contact,
  footerColumns,
  footerDescription,
  footerLinks,
  site,
  socials,
} from "@/content/site";

export function Footer() {
  return (
    /* Dark band — bone text on primary-dark, lime kept for hovers and headings. */
    <footer className="dark-band mt-20">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr]">
        {/* --- Column 1: identity ------------------------------------------ */}
        <div>
          <span
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-lg border-2 border-background font-display text-h3 text-background"
          >
            TL
          </span>

          <p className="mt-6 max-w-sm text-small text-background/70">
            {footerDescription}
          </p>

          <p className="mt-6 text-small text-background/50">
            A facility of {site.university}.
          </p>
        </div>

        {/* --- Columns 2 and 3: link lists ---------------------------------- */}
        {footerColumns.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="font-display text-small font-semibold text-accent">
              {column.heading}
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={`${column.heading}-${link.href}`}>
                  <Link
                    href={link.href}
                    className="text-small text-background/70 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* --- Column 4: visit --------------------------------------------- */}
        <div>
          <h2 className="font-display text-small font-semibold text-accent">
            Visit us
          </h2>

          <address className="mt-5 flex flex-col gap-4 text-small text-background/70 not-italic">
            <span className="flex gap-2.5">
              <MapPinIcon
                className="mt-0.5 size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <span>
                {contact.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </span>

            <span className="flex gap-2.5">
              <MailIcon
                className="mt-0.5 size-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              <a
                href={`mailto:${contact.email}`}
                className="transition-colors hover:text-accent"
              >
                {contact.email}
              </a>
            </span>
          </address>

          <p className="mt-4 text-small text-background/50">
            {contact.hoursSummary}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {socials.map((social) => {
              const Icon = SOCIAL_ICONS[social.icon];
              return (
                <li key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="grid size-10 place-items-center rounded-lg border border-background/25 text-background transition-colors hover:border-accent hover:bg-accent hover:text-primary-dark"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>

      {/* --- Copyright ----------------------------------------------------- */}
      <Container>
        <div className="flex flex-col gap-3 border-t border-background/15 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-background/50">
            © {new Date().getFullYear()} {site.name}, {site.university}.
          </p>

          <ul className="flex flex-wrap gap-5">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-small text-background/50 transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* Own row at the very bottom — nothing ever overlaps it. */}
      <CrowdCanvas />
    </footer>
  );
}
