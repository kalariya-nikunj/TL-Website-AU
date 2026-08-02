import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

/**
 * The site's only vertical spacing primitive.
 *
 * Every band on every page goes through here. Nothing else sets section
 * padding, so the whole page's rhythm is one variable — `--section-y` in
 * globals.css.
 *
 * Tone is a class, not a set of colour props: `dark` swaps the heading, lede,
 * eyebrow and underline colours through custom properties, so children inherit
 * the right treatment without being told about it.
 */

type SectionProps = {
  children: React.ReactNode;
  tone?: "default" | "tint" | "dark";
  size?: "normal" | "compact";
  id?: string;
  /**
   * Skip the Container so children can run to the screen edge. The child then
   * owns its own gutter — see CardRail, which has to bleed right.
   */
  bleed?: boolean;
  /** Points at a heading id so the landmark is named. */
  ariaLabelledBy?: string;
  className?: string;
};

/** The marker class is what the same-tone collapse rule matches on. */
const TONE = {
  default: "tone-default bg-background",
  tint: "tone-tint bg-primary-tint",
  dark: "tone-dark dark-band",
} as const;

export function Section({
  children,
  tone = "default",
  size = "normal",
  id,
  bleed = false,
  ariaLabelledBy,
  className,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "section",
        size === "compact" && "section-compact",
        TONE[tone],
        className,
      )}
    >
      {bleed ? children : <Container>{children}</Container>}
    </section>
  );
}
