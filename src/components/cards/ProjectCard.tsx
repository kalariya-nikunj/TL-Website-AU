import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/media/ImagePlaceholder";
import type { Project } from "@/types";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <li>
      <Card className="h-full">
        <ImagePlaceholder label={project.title} />

        <CardHeader>
          <CardTitle>
            <Link href={`/portfolio/${project.slug}`} className="transition-colors hover:text-primary">{project.title}</Link>
          </CardTitle>
          <CardDescription>
            {project.year} · {project.team.length}{" "}
            {project.team.length === 1 ? "student" : "students"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <p className="text-muted">{project.shortDescription}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
