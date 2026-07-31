import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/Container";
import type { NewsItem } from "@/types";

type NewsStripProps = {
  items: NewsItem[];
};

export function NewsStrip({ items }: NewsStripProps) {
  if (items.length === 0) return null;

  return (
    <aside aria-label="Announcements" className="border-b bg-muted/40">
      <Container className="py-3">
        <ul className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-6">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{item.label}</Badge>
              {item.href ? (
                <Link href={item.href}>{item.text}</Link>
              ) : (
                <span>{item.text}</span>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </aside>
  );
}
