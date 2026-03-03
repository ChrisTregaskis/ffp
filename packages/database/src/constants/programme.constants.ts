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

// Phase status values (programme_phases lifecycle)
export const PHASE_STATUSES = [
  // Phase has not been started by the user
  'not_started',
  // Phase is currently in progress
  'in_progress',
  // Phase has been completed
  'completed',
] as const;

export type PhaseStatus = (typeof PHASE_STATUSES)[number];
