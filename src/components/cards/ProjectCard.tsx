import { CardBase } from "@/components/cards/CardBase";
import type { Project } from "@/types";

type ProjectCardProps = {
  project: Project;
  priority?: boolean;
};

export function ProjectCard({ project, priority }: ProjectCardProps) {
  return (
    <li>
      <CardBase
        href={`/portfolio/${project.slug}`}
        image={project.images[0]}
        imageAlt={`${project.title}, built in the Tinkerer Lab`}
        badge={String(project.year)}
        title={project.title}
        meta={project.team.join(", ")}
        priority={priority}
        specs={project.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-lg border border-background/40 px-2 py-0.5"
          >
            {tag}
          </span>
        ))}
      />
    </li>
  );
}
