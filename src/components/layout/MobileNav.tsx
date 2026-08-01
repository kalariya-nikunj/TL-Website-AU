"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavLink } from "@/types";

type MobileNavProps = {
  links: NavLink[];
  secondaryLinks?: NavLink[];
  siteName: string;
};

/**
 * Client component — owns the open/closed state of the mobile drawer.
 * One of the few components in v1 allowed to be client-side.
 */
export function MobileNav({ links, secondaryLinks = [], siteName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon aria-hidden="true" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{siteName}</SheetTitle>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex flex-col px-4 pb-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="hover-underline border-b py-3 text-base text-ink transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}

          {secondaryLinks.length > 0 && (
            <div className="mt-6 flex flex-col">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="hover-underline py-2 text-small text-muted transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
