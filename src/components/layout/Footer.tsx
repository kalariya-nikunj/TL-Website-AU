import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { contact, footerLinks, navLinks, site, socials } from "@/content/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-heading text-lg font-semibold">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {site.university}
          </p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            {site.tagline}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-medium">Explore</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {[...navLinks, ...footerLinks].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium">Visit</h2>
          <address className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground not-italic">
            {contact.address.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
          <dl className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
            {contact.hours.map((slot) => (
              <div key={slot.label} className="flex justify-between gap-4">
                <dt>{slot.label}</dt>
                <dd>{slot.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="text-sm font-medium">Contact</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
            <li>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
            <li>
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                {contact.phone}
              </a>
            </li>
          </ul>

          <h2 className="mt-6 text-sm font-medium">Follow</h2>
          <ul className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {socials.map((social) => (
              <li key={social.label}>
                <a href={social.url} target="_blank" rel="noreferrer noopener">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="border-t py-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {site.name}, {site.university}.
        </p>
      </Container>
    </footer>
  );
}
