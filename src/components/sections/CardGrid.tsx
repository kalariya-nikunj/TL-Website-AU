import { cn } from "@/lib/utils";

type CardGridProps = {
  children: React.ReactNode;
  /**
   * Fixed column count at the largest breakpoint. Leave unset for the default
   * auto-filling grid — it already lands on 3 / 2 / 1 at the site's widths and
   * degrades correctly at sizes between them.
   */
  columns?: 2 | 3 | 4;
  className?: string;
};

const columnClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

/** The one grid every listing uses, so card rhythm never drifts between pages. */
export function CardGrid({ children, columns, className }: CardGridProps) {
  return (
    <ul
      className={cn(
        "gap-6",
        /* `card-grid` holds the auto-fill track built off --card-grid-min. */
        columns ? `grid grid-cols-1 ${columnClass[columns]}` : "card-grid",
        className,
      )}
    >
      {children}
    </ul>
  );
}
