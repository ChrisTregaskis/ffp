export const VIDEO_STATUSES = [
  // Video is a draft — not yet published to the catalogue
  'draft',
  // Video is active and available in the catalogue
  'active',
  // Video has been archived and is no longer available
  'archived',
] as const;

export type VideoStatus = (typeof VIDEO_STATUSES)[number];

// Exercise difficulty levels
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

// Movement type categories for exercises
export const MOVEMENT_TYPES = ['stretch', 'strength', 'mobility', 'balance'] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];
