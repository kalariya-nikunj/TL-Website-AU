import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  /** Set when the section starts with a heading, so the region is named. */
  ariaLabelledBy?: string;
};

/**
 * Vertical rhythm for every band on a page. Pages should stack <Section />s
 * rather than setting their own padding.
 */
export function Section({ children, className, ariaLabelledBy }: SectionProps) {
  return (
    <section aria-labelledby={ariaLabelledBy} className={cn("py-12 md:py-16", className)}>
      <Container>{children}</Container>
    </section>
  );
}
