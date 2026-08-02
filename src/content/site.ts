import type {
  FooterColumn,
  NavItem,
  NavLink,
  Social,
  Stat,
  TextToken,
} from "@/types";

export const site = {
  name: "Tinkerer Lab",
  shortName: "Tinkerer Lab",
  university: "Ahmedabad University",
  tagline: "Build it, break it, build it better.",
  description:
    "The Tinkerer Lab is Ahmedabad University's maker and fabrication space — open to every student who wants to turn an idea into a physical thing.",
  url: "https://tinkererlab.ahduni.edu.in",
} as const;

/**
 * PLACEHOLDER FIGURES — the homepage stat band. Pre-formatted strings rather
 * than numbers so thousands separators and the "+" are content decisions, not
 * locale accidents.
 */
export const stats: Stat[] = [
  { value: "24", label: "Machines available" },
  { value: "60+", label: "Workshops run" },
  { value: "1,200", label: "Students trained" },
  { value: "180", label: "Projects built" },
];

/** Flat list used by the footer's "Explore" column. */
export const navLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Workshops", href: "/workshops" },
  { label: "Facilities", href: "/facilities" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Help", href: "/help" },
];

/**
 * The header's own navigation. Kept separate from `navLinks` because the header
 * carries Home and the submenu tree while the footer does not.
 */
export const headerNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "The lab", href: "/about" },
      { label: "Our team", href: "/about#team" },
      { label: "Visit us", href: "/help#visit" },
    ],
  },
  {
    label: "Workshops",
    href: "/workshops",
    children: [
      { label: "Upcoming events", href: "/workshops" },
      { label: "Past events", href: "/workshops#past" },
      { label: "Calendar", href: "/workshops#calendar" },
    ],
  },
  {
    label: "Facilities",
    href: "/facilities",
    children: [
      { label: "All equipment", href: "/facilities" },
      { label: "Safety & training", href: "/facilities#safety" },
      { label: "Book a machine", href: "/facilities#booking" },
    ],
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    children: [
      { label: "Student projects", href: "/portfolio" },
      { label: "Lab projects", href: "/portfolio#lab" },
    ],
  },
  {
    label: "Help",
    href: "/help",
    children: [
      { label: "FAQ", href: "/help#faq" },
      { label: "Access & rules", href: "/help#access" },
      { label: "Contact", href: "/help#contact" },
    ],
  },
];

/**
 * Header colour scheme. Every value is a palette token name, mapped to a class
 * in Header.tsx — switching `navColor` from "ink" to "primary" recolours the
 * whole nav with no other edits.
 */
export const headerConfig = {
  /** Nav link colour once the header has a solid background. */
  navColor: "ink",
  /**
   * Nav link colour while the header is transparent. The homepage hero is a
   * light bone panel at scroll 0, so this has to be dark — switch to
   * "background" if a dark full-bleed hero ever replaces it.
   */
  topNavColor: "primary",
  /** Wordmark colour. Falls back to `topNavColor` while transparent. */
  logoTextColor: "primary",
  /** Underline and hover colour. */
  accentColor: "accent",
} as const satisfies Record<string, TextToken>;

/** The three lines of the wordmark, top to bottom. */
export const headerWordmark = [
  "Tinkerer Lab",
  "Ahmedabad",
  "University",
] as const;

export const contact = {
  email: "tinkererlab@ahduni.edu.in",
  phone: "+91 79 6191 1000",
  address: [
    "Tinkerer Lab, School of Engineering and Applied Science",
    "Ahmedabad University, Commerce Six Roads",
    "Navrangpura, Ahmedabad 380009, Gujarat",
  ],
  hours: [
    { label: "Monday – Friday", value: "09:00 – 18:00" },
    { label: "Saturday", value: "10:00 – 14:00" },
    { label: "Sunday", value: "Closed" },
  ],
  /** One-line summary for the footer, where the full table is too much. */
  hoursSummary: "Mon – Fri, 09:00 – 18:00",
} as const;

/** `label` becomes the `aria-label` — these render as bare icons. */
export const socials: Social[] = [
  { label: "Instagram", url: "https://instagram.com", icon: "instagram" },
  { label: "LinkedIn", url: "https://linkedin.com", icon: "linkedin" },
  { label: "YouTube", url: "https://youtube.com", icon: "youtube" },
  { label: "GitHub", url: "https://github.com", icon: "github" },
];

/**
 * Small print beside the copyright line. Real routes only — add privacy and
 * accessibility pages before linking to them.
 */
export const footerLinks: NavLink[] = [
  { label: "Sign in", href: "/login" },
  { label: "My registrations", href: "/my-registrations" },
];

/** Placeholder blurb for the footer's first column. */
export const footerDescription =
  "The Tinkerer Lab is a student workshop for making real things — laser cutting, 3D printing, CNC, electronics and hand tools, all under one roof. Come in with a sketch, leave with a prototype. No experience needed; every machine has an induction that teaches you to use it safely.";

/** The footer's two link columns. */
export const footerColumns: FooterColumn[] = [
  {
    heading: "Explore",
    links: [
      { label: "About", href: "/about" },
      { label: "Workshops & events", href: "/workshops" },
      { label: "Facilities", href: "/facilities" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Help", href: "/help" },
    ],
  },
  {
    heading: "Get involved",
    links: [
      { label: "Upcoming workshops", href: "/workshops" },
      { label: "Book a machine", href: "/facilities#booking" },
      { label: "Safety & training", href: "/facilities#safety" },
      { label: "FAQ", href: "/help#faq" },
      { label: "Contact us", href: "/help#contact" },
    ],
  },
];
