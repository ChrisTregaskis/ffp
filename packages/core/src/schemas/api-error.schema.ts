import { z } from 'zod';

/**
 * One failing field in a 400's `details` array: the shape the API reports both
 * for a request body that fails to parse and for a value a service refuses.
 */
export const apiFieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.string(),
});

export const apiFieldErrorsSchema = z.array(apiFieldErrorSchema);

/** The body of every API error response. */
export interface ApiErrorBody {
  /** Machine-readable error code */
  error: string;
  /** Human-readable message */
  message: string;
  requestId?: string;
  /** Extra context; per-field failures are an `ApiFieldError[]` */
  details?: Record<string, unknown> | unknown[];
}

export type ApiFieldError = z.infer<typeof apiFieldErrorSchema>;
