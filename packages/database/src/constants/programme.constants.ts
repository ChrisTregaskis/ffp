// Programme status values
export const PROGRAMME_STATUSES = [
  // Programme is currently active and available for the user
  'active',
  // Programme temporarily paused by user or system
  'paused',
  // User has completed the programme
  'completed',
  // Programme archived (superseded by new assessment or removed)
  'archived',
] as const;

export type ProgrammeStatus = (typeof PROGRAMME_STATUSES)[number];
