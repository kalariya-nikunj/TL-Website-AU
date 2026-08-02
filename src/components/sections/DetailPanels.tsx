import { CheckIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The small repeated blocks the three detail templates share.
 *
 * Every one of them returns `null` when its data is missing, so a page can call
 * them unconditionally and never end up with a heading over nothing.
 */

/* -------------------------------------------------------------------------- */

/**
 * A status pill.
 *
 * `warning` on `warning-tint` measures 3.8:1 — under AA for body text — so the
 * caution variant carries ink copy and lets the border and ground do the
 * signalling, the same compromise StatusMessage makes.
 */
const TONE = {
  success: "border-success bg-success-tint text-success",
  warning: "border-warning bg-warning-tint text-ink",
  muted: "border-border bg-primary-tint text-muted",
  accent: "border-accent bg-accent text-primary-dark",
} as const;

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONE;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-small font-medium",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

/** A labelled block in a sidebar. Renders nothing without children. */
export function SidebarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (children === undefined || children === null || children === false) {
    return null;
  }

  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="mt-1.5 text-small text-ink">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** A plain bulleted list with a heading. Absent or empty list → nothing. */
export function DetailList({
  title,
  items,
  id,
}: {
  title: string;
  items?: string[];
  id?: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-h3 text-primary-dark">
        {title}
      </h2>
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-body text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/** A list where every entry is a thing you can do. Accent ticks. */
export function CheckList({
  title,
  items,
  id,
}: {
  title: string;
  items?: string[];
  id?: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-h3 text-primary-dark">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5 text-body text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <CheckIcon
              className="mt-1 size-4 shrink-0 text-accent-dark"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The materials pair: what the machine takes, and what will ruin it or hurt
 * someone. The second panel is destructive-toned on purpose — it is the only
 * place on this site where "do not" carries real consequences.
 */
export function MaterialsPanels({
  works,
  never,
}: {
  works?: string[];
  never?: string[];
}) {
  if (!works?.length && !never?.length) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {works && works.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="font-display text-h3 text-primary-dark">Works with</h3>
          <ul className="mt-3 flex flex-col gap-2 text-small text-muted">
            {works.map((item) => (
              <li key={item} className="flex gap-2.5">
                <CheckIcon
                  className="mt-0.5 size-4 shrink-0 text-accent-dark"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {never && never.length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive-tint p-5">
          <h3 className="font-display text-h3 text-destructive-dark">
            Never use
          </h3>
          <ul className="mt-3 flex flex-col gap-2 text-small text-destructive-dark">
            {never.map((item) => (
              <li key={item} className="flex gap-2.5">
                <XIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** The specs table, styled to match the one in the facility accordion. */
export function SpecList({
  specs,
}: {
  specs: { label: string; value: string }[];
}) {
  if (specs.length === 0) return null;

  return (
    <dl className="flex flex-col gap-2 text-small">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="flex justify-between gap-6 border-b border-border pb-2"
        >
          <dt className="text-muted">{spec.label}</dt>
          <dd className="text-right text-ink">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
