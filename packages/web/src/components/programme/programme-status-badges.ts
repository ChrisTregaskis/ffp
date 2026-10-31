import type { ProgrammeDetailResponse } from '@ffp/core';

import type { BadgeProps } from '@web/components/atoms';

type Phase = ProgrammeDetailResponse['phases'][number];
type SessionStatus = NonNullable<Phase['sessions'][number]['userSession']>['status'];

/** A phase's status as a badge, on the member's timeline and the admin's phases table. */
export const PHASE_STATUS_BADGES: Record<Phase['status'], BadgeProps> = {
  completed: { label: 'Complete', variant: 'success', appearance: 'solid' },
  in_progress: { label: 'In Progress', variant: 'brand', appearance: 'solid' },
  not_started: { label: 'Upcoming', variant: 'muted', appearance: 'soft' },
};

/** A session's status as a badge; a session can also be skipped, which a phase cannot. */
export const SESSION_STATUS_BADGES: Record<SessionStatus, BadgeProps> = {
  ...PHASE_STATUS_BADGES,
  skipped: { label: 'Skipped', variant: 'warning', appearance: 'soft' },
};

type ProgrammeStatus = ProgrammeDetailResponse['programme']['status'];

/** A programme's status as a badge; the Users list's Programme status column reads it too. */
export const PROGRAMME_STATUS_BADGES: Record<ProgrammeStatus, BadgeProps> = {
  active: { label: 'Active', variant: 'success', appearance: 'solid' },
  paused: { label: 'Paused', variant: 'warning', appearance: 'solid' },
  completed: { label: 'Completed', variant: 'info', appearance: 'solid' },
  archived: { label: 'Archived', variant: 'muted', appearance: 'soft' },
};
