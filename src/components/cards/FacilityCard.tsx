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
import type { Facility } from "@/types";

type FacilityCardProps = {
  facility: Facility;
};

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <li>
      <Card className="h-full">
        <ImagePlaceholder label={facility.name} />

        <CardHeader>
          <CardTitle>
            <Link href={`/facilities/${facility.slug}`}>{facility.name}</Link>
          </CardTitle>
          <CardDescription>{facility.category}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground">{facility.shortDescription}</p>
          <div>
            <Badge variant={facility.requiresTraining ? "default" : "secondary"}>
              {facility.requiresTraining ? "Induction required" : "Open access"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
