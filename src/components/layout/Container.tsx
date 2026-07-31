import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** Renders as a different element — use `section`/`header`/`footer` where it reads better. */
  as?: "div" | "section" | "header" | "footer" | "main" | "nav";
};

/**
 * The single horizontal gutter for the whole site. Nothing should set its own
 * max-width or page padding — use this instead so every page lines up.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </Tag>
  );
}
