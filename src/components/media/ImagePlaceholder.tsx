import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  /** The label a screen reader would get from the real image's alt text. */
  label: string;
  className?: string;
  ratio?: "video" | "square" | "portrait";
};

const ratioClass = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
} as const;

/**
 * Stand-in for artwork that does not exist yet.
 *
 * Phase 5 replaces every usage with `next/image` pointed at the real file in
 * `/public/images/…` — the `label` becomes the `alt` text. Keeping the box here
 * means layout is already correct before any photography lands.
 */
export function ImagePlaceholder({
  label,
  className,
  ratio = "video",
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex items-center justify-center overflow-hidden bg-muted p-4 text-center text-xs text-muted-foreground",
        ratioClass[ratio],
        className,
      )}
    >
      <span className="line-clamp-3">{label}</span>
    </div>
  );
}
