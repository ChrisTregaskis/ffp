/**
 * Session Query Key Factory
 *
 * Hierarchical query keys for session-related cache management.
 */
export const sessionKeys = {
  /** Base key for all session queries */
  all: ['sessions'] as const,

  /** Session detail by phase and template session */
  detail: (phaseId: string, templateSessionId: string) =>
    [...sessionKeys.all, 'detail', phaseId, templateSessionId] as const,
};
