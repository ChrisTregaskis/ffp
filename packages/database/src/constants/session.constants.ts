// Session status values (user_sessions lifecycle)
export const SESSION_STATUSES = [
  // Session has not been started by the user
  'not_started',
  // Session is currently in progress
  'in_progress',
  // Session has been completed
  'completed',
  // Session was skipped by the user
  'skipped',
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];
