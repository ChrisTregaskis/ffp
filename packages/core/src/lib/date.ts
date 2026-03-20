/**
 * Formats a Date to a date-only string (YYYY-MM-DD) for PostgreSQL date columns.
 *
 * @example
 * ```typescript
 * formatDateOnly(new Date('2026-03-20T10:30:00Z')) // '2026-03-20'
 * ```
 */
export const formatDateOnly = (date: Date): string => {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
