/**
 * dateUtils.ts
 * -----------
 * Pure, side-effect-free helpers for formatting and validating dates.
 * All functions accept ISO 8601 strings or Date objects so they compose
 * cleanly with the rest of the application.
 */

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string into a localised, human-readable short date.
 * e.g. "2024-06-15T00:00:00.000Z" → "Jun 15, 2024"
 *
 * Returns an empty string for falsy input so callers can safely use the
 * result in JSX without extra null-guards.
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO date string as a relative human description.
 * Examples:
 *   - within the same day  → "Today"
 *   - yesterday            → "Yesterday"
 *   - tomorrow             → "Tomorrow"
 *   - within 7 days        → "In 3 days" / "3 days ago"
 *   - further away         → falls back to formatDate()
 */
export function formatRelativeDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(dateStr);
}

/**
 * Formats an ISO date string into the "YYYY-MM-DD" format required by
 * HTML <input type="date"> elements.
 */
export function toInputDateFormat(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns true when the supplied string represents a valid, parseable date.
 * Rejects the special `NaN` case that `new Date()` accepts silently.
 */
export function isValidDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Returns true when the supplied date string is strictly in the future
 * (i.e. after the current moment, not just today).
 */
export function isFutureDate(dateStr: string): boolean {
  if (!isValidDate(dateStr)) return false;
  return new Date(dateStr) > new Date();
}

/**
 * Returns true when the date represented by the string falls before
 * the current moment (i.e. it has already passed).
 */
export function isPastDate(dateStr: string): boolean {
  if (!isValidDate(dateStr)) return false;
  return new Date(dateStr) < new Date();
}

// ─── Calculations ─────────────────────────────────────────────────────────────

/**
 * Calculates the number of complete calendar days between two ISO date strings.
 * A positive result means `to` is after `from`.
 */
export function getDaysBetween(from: string, to: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / msPerDay);
}

/**
 * Adds `days` calendar days to the given ISO date string and returns a new
 * ISO string.  Negative values move the date backwards.
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Returns an ISO string for today's date at midnight UTC.
 * Useful as a default value for due-date inputs.
 */
export function todayISO(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Returns `{ start, end }` ISO strings for the current calendar week
 * (Monday → Sunday) in the local timezone.
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday.toISOString(), end: sunday.toISOString() };
}
