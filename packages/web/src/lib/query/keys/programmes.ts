export const programmeKeys = {
  /** Base key for all programme queries */
  all: ['programmes'] as const,
  /** Active programme for the current user */
  active: () => [...programmeKeys.all, 'active'] as const,
  /** Full programme detail with tiered visibility (phases, sessions, exercises) */
  activeDetail: () => [...programmeKeys.active(), 'detail'] as const,
  /** Aggregate progress statistics for the active programme */
  activeProgress: () => [...programmeKeys.active(), 'progress'] as const,
};
