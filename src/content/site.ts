import type { Link, NavLink } from "@/types";

export const site = {
  name: "Tinkerer Lab",
  shortName: "Tinkerer Lab",
  university: "Ahmedabad University",
  tagline: "Build it, break it, build it better.",
  description:
    "The Tinkerer Lab is Ahmedabad University's maker and fabrication space — open to every student who wants to turn an idea into a physical thing.",
  url: "https://tinkererlab.ahduni.edu.in",
} as const;

export const navLinks: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Workshops", href: "/workshops" },
  { label: "Facilities", href: "/facilities" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Help", href: "/help" },
];

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
} as const;

export const socials: Link[] = [
  { label: "Instagram", url: "https://instagram.com" },
  { label: "LinkedIn", url: "https://linkedin.com" },
  { label: "YouTube", url: "https://youtube.com" },
];

/** Secondary links shown in the footer only. */
export const footerLinks: NavLink[] = [
  { label: "Sign in", href: "/login" },
  { label: "My registrations", href: "/my-registrations" },
];
