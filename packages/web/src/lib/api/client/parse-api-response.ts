/** Structural issue type matching both Zod v3 and v4. */
interface ZodIssuelike {
  path: (string | number)[];
  code: string;
  message: string;
}

/** Structural error type matching both Zod v3 and v4 ZodError. */
interface ZodErrorlike extends Error {
  issues: ZodIssuelike[];
}

/** Structural type for any Zod schema with safeParse — avoids v3/v4 import mismatch. */
interface ParseableSchema<T> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: ZodErrorlike };
}

/**
 * Parse an API response with a Zod schema, logging detailed errors on failure.
 *
 * Use instead of `schema.parse(response)` in API client methods.
 * Logs structured Zod validation errors before re-throwing, so schema
 * mismatches are immediately visible in the browser console.
 */
export function parseApiResponse<T>(
  schema: ParseableSchema<T>,
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
