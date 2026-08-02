import { cn } from "@/lib/utils";

/**
 * A toggle in a filter row.
 *
 * A real `<button>` with `aria-pressed`, not a styled span: filtering is an
 * action with a state, and pressed state is the only thing that communicates
 * "this one is on" to anyone not looking at the colour.
 */

type FilterChipProps = {
  children: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
  className?: string;
};

export function FilterChip({
  children,
  pressed,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-small font-medium transition-colors",
        pressed
          ? "border-accent bg-accent text-primary-dark"
          : "border-border bg-surface text-ink hover:bg-primary-tint hover:text-primary",
        className,
      )}
    >
      {children}
    </button>
  );
}
