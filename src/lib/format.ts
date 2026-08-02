const TIME_ZONE = "Asia/Kolkata";
const LOCALE = "en-IN";

/** "14 August 2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "10:00 am" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/**
 * "14 Aug" — the card badge, which uppercases it in CSS. Short enough to sit in
 * a pill without wrapping at any card width.
 */
export function formatCardDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/** "August 2026" — the sticky group heading on the events list. */
export function formatMonthGroup(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(new Date(iso));
}

/**
 * The three lines of an event row's date block: "AUG", "14", "Friday".
 *
 * One formatter rather than three so the parts can never disagree about which
 * day they are describing.
 */
export function formatDateBlock(iso: string): {
  month: string;
  day: string;
  weekday: string;
} {
  const date = new Date(iso);
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: TIME_ZONE }).format(
      date,
    );

  return {
    month: part({ month: "short" }),
    day: part({ day: "numeric" }),
    weekday: part({ weekday: "long" }),
  };
}

/**
 * "14 August 2026, 10:00 am – 12:30 pm" for a same-day event,
 * "5 September 2026 – 6 September 2026" when it spans days.
 */
export function formatEventRange(startsAt: string, endsAt: string): string {
  const sameDay = formatDate(startsAt) === formatDate(endsAt);
  return sameDay
    ? `${formatDate(startsAt)}, ${formatTime(startsAt)} – ${formatTime(endsAt)}`
    : `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
}
