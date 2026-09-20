/**
 * Query keys for the assessment flow admin surface.
 *
 * Kept separate from `assessmentKeys`, which covers the member-facing
 * assessment run — the two read different endpoints and invalidate apart.
 */
export const assessmentFlowKeys = {
  /** Base key for all admin assessment flow queries */
  all: ['assessment-flows'] as const,
  /** All flow list queries */
  lists: () => [...assessmentFlowKeys.all, 'list'] as const,
  /** A flow list query for a given set of pagination and filter params */
  list: (params: Record<string, unknown>) => [...assessmentFlowKeys.lists(), params] as const,
  /** All flow detail queries */
  details: () => [...assessmentFlowKeys.all, 'detail'] as const,
  /** A single flow by public identifier */
  detail: (publicId: string) => [...assessmentFlowKeys.details(), publicId] as const,
};
