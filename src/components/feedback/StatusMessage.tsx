import { CircleCheckIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Status = "error" | "success" | "warning";

type StatusMessageProps = {
  status: Status;
  /** Optional bold lead-in above the message body. */
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Point a field's `aria-describedby` here when this describes an input. */
  id?: string;
};

/**
 * The single way this site reports state.
 *
 * The design system forbids state carried by colour alone, so every variant
 * ships three signals together — a coloured border, an inline icon, and text —
 * plus a visually hidden label so the status survives for screen readers and
 * in forced-colours mode. Using the tokens directly instead of this component
 * is how a colour-only error slips in, so route feedback through here.
 */
const STATUS = {
  error: {
    box: "border-destructive bg-destructive-tint text-destructive-dark",
    icon: OctagonXIcon,
    label: "Error:",
    // Errors interrupt; confirmations and cautions wait their turn.
    role: "alert" as const,
    live: "assertive" as const,
  },
  success: {
    box: "border-success bg-success-tint text-success",
    icon: CircleCheckIcon,
    label: "Success:",
    role: "status" as const,
    live: "polite" as const,
  },
  warning: {
    /*
     * `warning` on `warning-tint` measures 3.8:1 — under the 4.5:1 AA needs for
     * body text — and the palette has no warning-dark. So the copy is ink and
     * the state rides on the border and icon instead.
     */
    box: "border-warning bg-warning-tint text-ink",
    icon: TriangleAlertIcon,
    label: "Warning:",
    role: "status" as const,
    live: "polite" as const,
  },
} as const;

export function StatusMessage({
  status,
  title,
  children,
  className,
  id,
}: StatusMessageProps) {
  const { box, icon: Icon, label, role, live } = STATUS[status];

  return (
    <div
      id={id}
      role={role}
      aria-live={live}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-3 text-small",
        box,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <span className="sr-only">{label} </span>
        {title && <p className="font-display font-semibold">{title}</p>}
        <div className={cn(title && "mt-1")}>{children}</div>
      </div>
    </div>
  );
}
