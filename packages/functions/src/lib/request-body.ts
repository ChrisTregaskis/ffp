import { ValidationError } from '@ffp/core/server';

/**
 * Parses a JSON request body from a Lambda event.
 *
 * @param body - The raw event body string (may be null/undefined)
 * @param options - Configuration options
 * @param options.required - If true, throws when body is missing (default: true)
 * @returns Parsed JSON value, or empty object if body is absent and not required
 * @throws {ValidationError} If body is required but missing, or contains invalid JSON
 */
export function parseJsonBody(body: string | undefined, options?: { required?: boolean }): unknown {
  const required = options?.required ?? true;

  if (!body) {
    if (required) {
      throw new ValidationError('Request body is required');
    }

    return {};
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
}
