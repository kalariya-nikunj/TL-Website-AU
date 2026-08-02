import type { NewsItem } from "@/types";

/** PLACEHOLDER DATA — drives the home page announcements strip. */
export const news: NewsItem[] = [
  {
    id: "open-day",
    label: "Event",
    date: "19 Sep",
    text: "Makers' Open Day — 19 September, the whole lab is open.",
    href: "/workshops/makers-open-day",
  },
  {
    id: "cnc-online",
    label: "New",
    date: "02 Sep",
    text: "The CNC router is back online after servicing.",
    href: "/facilities/cnc-router",
  },
  {
    id: "registrations",
    label: "Notice",
    date: "28 Aug",
    text: "Autumn workshop registrations are now open.",
    href: "/workshops",
  },
];
