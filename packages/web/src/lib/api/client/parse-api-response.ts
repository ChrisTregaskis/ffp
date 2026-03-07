import type { z } from 'zod';

/**
 * Parse an API response with a Zod schema, logging detailed errors on failure.
 *
 * Use instead of `schema.parse(response)` in API client methods.
 * Logs structured Zod validation errors before re-throwing, so schema
 * mismatches are immediately visible in the browser console.
 */
export function parseApiResponse<T>(
  schema: z.ZodType<T>,
  response: unknown,
  context: { method: string; path: string }
): T {
  const result = schema.safeParse(response);

  if (result.success) {
    return result.data;
  }

  // Log structured error for developer visibility
  const fieldErrors = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
    received: issue.path.reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[String(key)];
      }

      return undefined;
    }, response),
  }));

  console.error(`[API] Zod validation failed on ${context.method} ${context.path}`, {
    errors: fieldErrors,
    errorCount: result.error.issues.length,
  });

  // Re-throw as ZodError so React Query treats it as an error
  throw result.error;
}
