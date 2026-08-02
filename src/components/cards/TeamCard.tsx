import Image from "next/image";
import { LinkIcon, MailIcon } from "lucide-react";

import { SOCIAL_ICONS } from "@/components/layout/SocialIcons";
import type { Link as ContactLink, TeamMember } from "@/types";

/**
 * A face, a name, a role, and a way to reach the person.
 *
 * Deliberately NOT a link. The social icons are links, and a link inside a link
 * is invalid HTML that browsers resolve by silently dropping one of them — so
 * the card is a plain container and only the icons are interactive.
 */

const SIZES = "(min-width: 48rem) 15rem, 12rem";

/**
 * Icons are matched on the link's label. lucide dropped its brand icons at v1,
 * so LinkedIn and Instagram come from the marks built for the footer; Mail is
 * still lucide's.
 */
function iconFor(link: ContactLink) {
  const label = link.label.toLowerCase();

  if (label.includes("linkedin"))
    return {
      Icon: SOCIAL_ICONS.linkedin,
      name: (n: string) => `${n} on LinkedIn`,
    };
  if (label.includes("instagram"))
    return {
      Icon: SOCIAL_ICONS.instagram,
      name: (n: string) => `${n} on Instagram`,
    };
  if (label.includes("github"))
    return { Icon: SOCIAL_ICONS.github, name: (n: string) => `${n} on GitHub` };
  if (label.includes("youtube"))
    return {
      Icon: SOCIAL_ICONS.youtube,
      name: (n: string) => `${n} on YouTube`,
    };
  if (
    label.includes("mail") ||
    label.includes("email") ||
    link.url.startsWith("mailto:")
  )
    return { Icon: MailIcon, name: (n: string) => `Email ${n}` };

  /* Anything unrecognised still gets an icon and a usable label rather than
     dropping off the card. */
  return { Icon: LinkIcon, name: (n: string) => `${n} on ${link.label}` };
}

type TeamCardProps = {
  member: TeamMember;
};

export function TeamCard({ member }: TeamCardProps) {
  const links = member.links ?? [];

  return (
    <div className="card-chamfer relative aspect-3/4 w-full overflow-hidden bg-primary-tint">
      <Image
        src={member.photo}
        alt={member.name}
        fill
        sizes={SIZES}
        className="team-photo object-cover"
      />

      {/* Lighter than the content cards — this one only has to carry a name. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent from-55% to-primary-dark/85"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4">
        <p className="font-display text-team-name text-background">
          {member.name}
        </p>

        {/*
          A chip rather than translucent text: the role sits over whatever the
          photograph happens to be, and a solid ground is the only way its
          contrast is guaranteed rather than hoped for.
        */}
        <p className="rounded-lg bg-background px-2 py-0.5 text-small font-medium text-accent-dark">
          {member.role}
        </p>

        {links.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {links.map((link) => {
              const { Icon, name } = iconFor(link);
              /* mailto: is not a navigation, so it gets no _blank. */
              const external = /^https?:/i.test(link.url);

              return (
                <li key={link.url}>
                  <a
                    href={link.url}
                    aria-label={name(member.name)}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="flex size-8 items-center justify-center rounded-lg border border-background/40 text-background transition-colors hover:bg-accent hover:text-primary-dark"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
