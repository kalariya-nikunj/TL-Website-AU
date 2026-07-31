import type { TeamMember } from "@/types";

/** PLACEHOLDER DATA — replace with real team members in Phase 5. */
export const team: TeamMember[] = [
  {
    id: "lab-director",
    name: "Placeholder Name",
    role: "Lab Director",
    photo: "/images/team/placeholder-1.jpg",
    bio: "Placeholder bio. Oversees the lab, its curriculum, and its industry partnerships.",
    links: [{ label: "LinkedIn", url: "https://linkedin.com" }],
  },
  {
    id: "lab-manager",
    name: "Placeholder Name",
    role: "Lab Manager",
    photo: "/images/team/placeholder-2.jpg",
    bio: "Placeholder bio. Runs day-to-day operations, inductions, and machine maintenance.",
  },
  {
    id: "fabrication-lead",
    name: "Placeholder Name",
    role: "Fabrication Lead",
    photo: "/images/team/placeholder-3.jpg",
    bio: "Placeholder bio. Owns the CNC, laser, and woodworking bays.",
  },
  {
    id: "electronics-lead",
    name: "Placeholder Name",
    role: "Electronics Lead",
    photo: "/images/team/placeholder-4.jpg",
    bio: "Placeholder bio. Owns the electronics bench and embedded systems workshops.",
  },
  {
    id: "student-coordinator",
    name: "Placeholder Name",
    role: "Student Coordinator",
    photo: "/images/team/placeholder-5.jpg",
    bio: "Placeholder bio. First point of contact for student projects and bookings.",
  },
];

export function getTeamMember(id: string): TeamMember | undefined {
  return team.find((member) => member.id === id);
}
