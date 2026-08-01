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
import { formatEventRange } from "@/lib/format";
import type { LabEvent } from "@/types";

type EventCardProps = {
  event: LabEvent;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <li>
      <Card className="h-full">
        <ImagePlaceholder label={event.title} />

        <CardHeader>
          <CardTitle>
            <Link href={`/workshops/${event.slug}`} className="transition-colors hover:text-primary">{event.title}</Link>
          </CardTitle>
          <CardDescription>
            {formatEventRange(event.startsAt, event.endsAt)}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <p className="text-muted">{event.shortDescription}</p>
          <p className="text-sm text-muted">{event.location}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={event.registrationOpen ? "default" : "secondary"}>
              {event.registrationOpen ? "Registration open" : "Drop in"}
            </Badge>
            {typeof event.capacity === "number" && (
              <Badge variant="outline">{event.capacity} places</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
