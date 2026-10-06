import type { CreateVideoInput } from '@ffp/core';

/** Internal form values for the video metadata form (all variants) */
export interface VideoMetadataFormValues {
  title: string;
  description: string;
  movementType: NonNullable<CreateVideoInput['movementType']> | '';
  difficulty: NonNullable<CreateVideoInput['difficulty']> | '';
  bodyParts: string[];
  equipment: string[];
  tags: string[];
  /** Edit variant only — video catalogue status */
  status: string;
  /** Edit variant only — default exercise prescription fields (string form values) */
  defaultSets: string;
  defaultReps: string;
  defaultDurationSeconds: string;
  defaultRestSeconds: string;
  defaultNotes: string;
}
