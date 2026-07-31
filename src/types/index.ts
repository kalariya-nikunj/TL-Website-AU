/**
 * Shared domain types.
 *
 * `TeamMember`, `Facility`, `Project` and `LabEvent` are authored as content-as-code
 * in `src/content/*`. `Registration` and `ContactSubmission` only ever live in
 * Firestore (Phase 4) and are never bundled into the client.
 */

export type Link = {
  label: string;
  url: string;
};

export type NavLink = {
  label: string;
  href: string;
};

export type Spec = {
  label: string;
  value: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio?: string;
  links?: Link[];
};

export type Facility = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  specs: Spec[];
  safetyNotes?: string[];
  images: string[];
  requiresTraining: boolean;
};

export type Project = {
  slug: string;
  title: string;
  team: string[];
  year: number;
  tags: string[];
  shortDescription: string;
  description: string;
  images: string[];
  featured: boolean;
};

export type LabEvent = {
  slug: string;
  title: string;
  /** ISO 8601 datetime */
  startsAt: string;
  /** ISO 8601 datetime */
  endsAt: string;
  location: string;
  shortDescription: string;
  description: string;
  capacity?: number;
  registrationOpen: boolean;
  image?: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type NewsItem = {
  id: string;
  label: string;
  text: string;
  href?: string;
};

/**
 * Firestore-only records. `createdAt` is a Firestore `Timestamp` at rest; it is
 * typed as `string` (ISO) once serialised for a Server Component.
 */
export type Registration = {
  id: string;
  eventSlug: string;
  userId: string;
  name: string;
  email: string;
  studentId?: string;
  department?: string;
  phone?: string;
  createdAt: string;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};
