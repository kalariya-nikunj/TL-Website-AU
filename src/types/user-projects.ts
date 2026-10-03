export const PROJECT_CATEGORIES = {
  DIM: "Design, Innovation and Making (DIM)",
  PDR: "Product Dissection and Realization (PDR)",
  RESEARCH: "Research under Professor",
  PERSONAL: "Personal Project",
  STARTUP: "Start-up",
} as const;

export type ProjectCategory = keyof typeof PROJECT_CATEGORIES;
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type ProjectMemberRole = "OWNER" | "MEMBER";

/** Firestore project serialized for the client; timestamps are ISO strings. */
export type Project = {
  projectId: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  shortDescription: string;
  description: string;
  ownerUid: string;
  status: ProjectStatus;
  department?: string;
  branch?: string;
  professorName?: string;
  contactEmail?: string;
  contactPhone?: string;
  instagramUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  uid: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
  joinedAt: string;
};

export type ProjectDetailData = {
  project: Project;
  members: ProjectMember[];
  viewerIsOwner: boolean;
};

export type ProjectMemberCandidate = Pick<ProjectMember, "uid" | "name" | "email">;

export type ProjectInput = {
  title: string;
  category: ProjectCategory;
  shortDescription: string;
  description: string;
  department?: string;
  branch?: string;
  professorName?: string;
  contactEmail?: string;
  contactPhone?: string;
  instagramUrl?: string;
  status?: ProjectStatus;
};
