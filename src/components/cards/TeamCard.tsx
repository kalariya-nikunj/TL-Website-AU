import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImagePlaceholder } from "@/components/media/ImagePlaceholder";
import type { TeamMember } from "@/types";

type TeamCardProps = {
  member: TeamMember;
  /** Compact variant used by the home page preview. */
  compact?: boolean;
};

export function TeamCard({ member, compact = false }: TeamCardProps) {
  return (
    <li>
      <Card className="h-full">
        <ImagePlaceholder label={member.name} ratio="square" />

        <CardHeader>
          <CardTitle>{member.name}</CardTitle>
          <CardDescription>{member.role}</CardDescription>
        </CardHeader>

        {!compact && (member.bio || member.links?.length) && (
          <CardContent className="flex flex-col gap-3">
            {member.bio && <p className="text-muted-foreground">{member.bio}</p>}
            {member.links && member.links.length > 0 && (
              <ul className="flex flex-wrap gap-4 text-sm">
                {member.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        )}
      </Card>
    </li>
  );
}
