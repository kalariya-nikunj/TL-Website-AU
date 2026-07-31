import type { NewsItem } from "@/types";

/** PLACEHOLDER DATA — drives the home page announcements strip. */
export const news: NewsItem[] = [
  {
    id: "open-day",
    label: "Event",
    text: "Makers' Open Day — 19 September, the whole lab is open.",
    href: "/workshops/makers-open-day",
  },
  {
    id: "cnc-online",
    label: "New",
    text: "The CNC router is back online after servicing.",
    href: "/facilities/cnc-router",
  },
  {
    id: "registrations",
    label: "Notice",
    text: "Autumn workshop registrations are now open.",
    href: "/workshops",
  },
];
