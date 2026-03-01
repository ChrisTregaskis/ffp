/**
 * Query parameter parsing utilities for Lambda handlers.
 *
 * API Gateway v2 provides query parameters as Record<string, string>.
 * These helpers convert raw string values to typed arrays and optional scalars.
 */

/**
 * Parse a comma-separated query parameter into a string array.
 * Returns undefined if the parameter is absent or empty.
 *
 * @example
 * parseArrayParam('hamstrings,glutes')  // ['hamstrings', 'glutes']
 * parseArrayParam('single')             // ['single']
 * parseArrayParam('')                   // undefined
 * parseArrayParam(undefined)            // undefined
 */
export function parseArrayParam(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}
