import Image from "next/image";
import { LinkIcon, MailIcon } from "lucide-react";

import { SOCIAL_ICONS } from "@/components/layout/SocialIcons";
import type { Link as ContactLink, TeamMember } from "@/types";

/**
 * A person, sideways.
 *
 * TeamCard is a portrait for the team rail; this is the same information laid
 * out to sit in a sidebar — supervisor of a machine, instructor of a workshop,
 * credit on a project.
 *
 * Like TeamCard it is not a link: the social icons are, and a link inside a
 * link is invalid.
 */

/** Same label matching as TeamCard — lucide has no brand icons since v1. */
function iconFor(link: ContactLink) {
  const label = link.label.toLowerCase();

  if (label.includes("linkedin"))
    return { Icon: SOCIAL_ICONS.linkedin, verb: "on LinkedIn" };
  if (label.includes("instagram"))
    return { Icon: SOCIAL_ICONS.instagram, verb: "on Instagram" };
  if (label.includes("github"))
    return { Icon: SOCIAL_ICONS.github, verb: "on GitHub" };
  if (label.includes("youtube"))
    return { Icon: SOCIAL_ICONS.youtube, verb: "on YouTube" };
  if (
    label.includes("mail") ||
    label.includes("email") ||
    link.url.startsWith("mailto:")
  )
    return { Icon: MailIcon, verb: "by email" };

  return { Icon: LinkIcon, verb: `on ${link.label}` };
}

type PersonCreditProps = {
  member: TeamMember;
  /** Overrides the member's own role — "Supervisor", "Instructor". */
  role?: string;
};

export function PersonCredit({ member, role }: PersonCreditProps) {
  const links = member.links ?? [];

  return (
    <div className="flex items-center gap-3">
      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-primary-tint">
        <Image
          src={member.photo}
          alt=""
          aria-hidden="true"
          fill
          sizes="48px"
          className="object-cover"
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium text-ink">
          {member.name}
        </p>
        <p className="truncate text-small text-muted">{role ?? member.role}</p>
      </div>

      {links.length > 0 && (
        <ul className="flex shrink-0 gap-1">
          {links.map((link) => {
            const { Icon, verb } = iconFor(link);
            /* mailto: is not a navigation, so it gets no _blank. */
            const external = /^https?:/i.test(link.url);

            return (
              <li key={link.url}>
                <a
                  href={link.url}
                  aria-label={
                    verb === "by email"
                      ? `Email ${member.name}`
                      : `${member.name} ${verb}`
                  }
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex size-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-accent hover:text-primary-dark"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
