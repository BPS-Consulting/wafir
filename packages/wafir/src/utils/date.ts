// Copyright (c) BPS-Consulting. Licensed under the AGPLv3 License.

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD).
 */
function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves a date value token to an ISO date string (YYYY-MM-DD).
 *
 * Supported tokens:
 *   - "today" → current date
 *   - "today+N" → N days from today (e.g., "today+7")
 *   - "today-N" → N days before today (e.g., "today-30")
 *   - Static ISO date (YYYY-MM-DD) → returned as-is
 *   - Empty/undefined → returns empty string
 *
 * @param value - The date value or token to resolve
 * @returns The resolved ISO date string (YYYY-MM-DD) or empty string
 *
 * @example
 * resolveDateValue("today")      // "2026-02-14" (current date)
 * resolveDateValue("today+7")    // "2026-02-21" (7 days from now)
 * resolveDateValue("today-30")   // "2026-01-15" (30 days ago)
 * resolveDateValue("2026-03-01") // "2026-03-01" (passthrough)
 */
export function resolveDateValue(value: string | undefined | null): string {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().toLowerCase();

  // Handle "today" with optional offset
  if (trimmed === "today") {
    return toISODateString(new Date());
  }

  // Handle "today+N" or "today-N"
  const todayOffsetMatch = trimmed.match(/^today([+-])(\d+)$/);
  if (todayOffsetMatch) {
    const [, operator, daysStr] = todayOffsetMatch;
    const days = parseInt(daysStr, 10);
    const date = new Date();
    const offset = operator === "+" ? days : -days;
    date.setDate(date.getDate() + offset);
    return toISODateString(date);
  }

  // Check if it's already an ISO date (YYYY-MM-DD)
  const isoDateMatch = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoDateMatch) {
    return value;
  }

  // Return as-is for any other format (let the browser handle it)
  return value;
}

/**
 * Checks if a value is a date token that needs resolution.
 * @param value - The value to check
 * @returns True if the value is a resolvable token like "today" or "today+N"
 */
export function isDateToken(value: string | undefined | null): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed === "today" || /^today[+-]\d+$/.test(trimmed);
}
