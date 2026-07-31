import { cn } from "@/lib/utils";

type CardGridProps = {
  children: React.ReactNode;
  /** Column count at the largest breakpoint. Always 1 on mobile. */
  columns?: 2 | 3 | 4;
  className?: string;
};

const columnClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/** The one grid every listing uses, so card rhythm never drifts between pages. */
export function CardGrid({ children, columns = 3, className }: CardGridProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-6", columnClass[columns], className)}>
      {children}
    </ul>
  );
}
