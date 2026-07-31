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
 * "14 August 2026, 10:00 am – 12:30 pm" for a same-day event,
 * "5 September 2026 – 6 September 2026" when it spans days.
 */
export function formatEventRange(startsAt: string, endsAt: string): string {
  const sameDay = formatDate(startsAt) === formatDate(endsAt);
  return sameDay
    ? `${formatDate(startsAt)}, ${formatTime(startsAt)} – ${formatTime(endsAt)}`
    : `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
}
