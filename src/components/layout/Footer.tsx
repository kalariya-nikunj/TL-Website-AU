import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { contact, footerLinks, navLinks, site, socials } from "@/content/site";

export function Footer() {
  return (
    /* Dark band — bone text on primary-dark, lime reserved for link hovers. */
    <footer className="dark-band mt-20">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-display text-h3">{site.name}</p>
          <p className="mt-2 max-w-xs text-small text-background/70">
            {site.university}
          </p>
          <p className="mt-4 max-w-xs text-small text-background/70">
            {site.tagline}
          </p>
        </div>

        <div>
          <h2 className="eyebrow">Explore</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {[...navLinks, ...footerLinks].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover-underline text-small text-background/70 transition-colors hover:text-background"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="eyebrow">Visit</h2>
          <address className="mt-4 flex flex-col gap-1 text-small text-background/70 not-italic">
            {contact.address.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <dl className="mt-4 flex flex-col gap-1 text-small text-background/70">
            {contact.hours.map((slot) => (
              <div key={slot.label} className="flex justify-between gap-4">
                <dt>{slot.label}</dt>
                <dd>{slot.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="eyebrow">Contact</h2>
          <ul className="mt-4 flex flex-col gap-2 text-small text-background/70">
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="hover-underline transition-colors hover:text-background"
              >
                {contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="hover-underline transition-colors hover:text-background"
              >
                {contact.phone}
              </a>
            </li>
          </ul>

          <h2 className="eyebrow mt-6">Follow</h2>
          <ul className="mt-4 flex flex-wrap gap-4 text-small text-background/70">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover-underline transition-colors hover:text-background"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="border-t border-background/15 py-6">
        <p className="text-small text-background/60">
          © {new Date().getFullYear()} {site.name}, {site.university}.
        </p>
      </Container>
    </footer>
  );
}
