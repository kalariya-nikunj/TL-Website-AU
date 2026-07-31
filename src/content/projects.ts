import type { Project } from "@/types";

/** PLACEHOLDER DATA — replace with real student projects in Phase 5. */
export const projects: Project[] = [
  {
    slug: "autonomous-rover",
    title: "Autonomous Campus Rover",
    team: ["Placeholder Name", "Placeholder Name", "Placeholder Name"],
    year: 2025,
    tags: ["Robotics", "Embedded", "Computer Vision"],
    shortDescription:
      "A four-wheeled rover that navigates the campus loop without a driver.",
    description:
      "Placeholder description. Built over two semesters: chassis machined on the CNC router, drive electronics assembled at the electronics bench, and perception running on an on-board single-board computer.",
    images: ["/images/projects/autonomous-rover.jpg"],
    featured: true,
  },
  {
    slug: "solar-water-monitor",
    title: "Solar Water Quality Monitor",
    team: ["Placeholder Name", "Placeholder Name"],
    year: 2025,
    tags: ["IoT", "Sustainability", "Sensors"],
    shortDescription:
      "A solar-powered buoy that logs turbidity, pH, and temperature.",
    description:
      "Placeholder description. Designed for a local lake survey. Enclosure laser-cut and sealed in the lab; data pushed over a low-power radio link.",
    images: ["/images/projects/solar-water-monitor.jpg"],
    featured: true,
  },
  {
    slug: "prosthetic-hand",
    title: "Low-Cost Prosthetic Hand",
    team: ["Placeholder Name", "Placeholder Name", "Placeholder Name"],
    year: 2024,
    tags: ["3D Printing", "Biomedical", "Mechanism Design"],
    shortDescription:
      "A fully 3D-printed, tendon-driven hand built for under ₹5,000.",
    description:
      "Placeholder description. Iterated across eleven printed revisions in the 3D printing bay, with grip testing against a standard object set.",
    images: ["/images/projects/prosthetic-hand.jpg"],
    featured: true,
  },
  {
    slug: "modular-furniture",
    title: "Modular Studio Furniture",
    team: ["Placeholder Name"],
    year: 2024,
    tags: ["CNC", "Furniture", "Design"],
    shortDescription:
      "A flat-pack desk system cut from a single sheet of plywood.",
    description:
      "Placeholder description. Joinery designed for tool-free assembly and cut in one pass on the CNC router.",
    images: ["/images/projects/modular-furniture.jpg"],
    featured: false,
  },
  {
    slug: "weather-balloon",
    title: "High-Altitude Weather Balloon",
    team: ["Placeholder Name", "Placeholder Name", "Placeholder Name", "Placeholder Name"],
    year: 2023,
    tags: ["Aerospace", "Telemetry", "Electronics"],
    shortDescription:
      "A student-built payload that reached 28 km and returned intact.",
    description:
      "Placeholder description. Foam payload shell, custom telemetry board, and a recovery plan built around a GSM and radio beacon pair.",
    images: ["/images/projects/weather-balloon.jpg"],
    featured: false,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export const featuredProjects = projects.filter((project) => project.featured);

export const projectSlugs = projects.map((project) => project.slug);
