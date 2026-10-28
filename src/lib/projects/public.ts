import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectStatus } from "@/types/user-projects";

export type PublicProjectSummary = {
  projectId: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  shortDescription: string;
  status: ProjectStatus;
  year: number;
  images: string[];
  tags: string[];
};

/** Public, deliberately narrow projection of every active student project. */
export async function listPublicActiveProjects(): Promise<PublicProjectSummary[]> {
  const snapshot = await adminDb().collection("projects").where("status", "==", "ACTIVE").get();
  const categories = Object.keys(PROJECT_CATEGORIES);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    const createdAt = data.createdAt && typeof data.createdAt.toDate === "function"
      ? data.createdAt.toDate()
      : null;
    const category = categories.includes(data.category) ? data.category as ProjectCategory : "PERSONAL";
    return {
      projectId: doc.id,
      slug: String(data.slug ?? doc.id),
      title: String(data.title ?? "Untitled project"),
      category,
      shortDescription: String(data.shortDescription ?? ""),
      status: data.status as ProjectStatus,
      year: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getFullYear() : new Date().getFullYear(),
      images: Array.isArray(data.images)
        ? data.images.filter((image: unknown): image is string => typeof image === "string" && image.startsWith("/images/") && !image.includes("..") && !image.includes("\\")).slice(0, 10)
        : [],
      tags: Array.isArray(data.tags)
        ? data.tags.filter((tag: unknown): tag is string => typeof tag === "string" && Boolean(tag.trim())).slice(0, 10)
        : [],
    };
  }).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
}
