import type { CreateVideoInput } from '@ffp/core';

/** Internal form values for the video metadata form (all variants) */
export interface VideoMetadataFormValues {
  title: string;
  description: string;
  difficulty: NonNullable<CreateVideoInput['difficulty']> | '';
  /** Movement tag publicIds */
  movementTags: string[];
  /** Body-area tag publicIds */
  bodyAreaTags: string[];
  equipment: string[];
  /** Edit variant only — video catalogue status */
  status: string;
  /** Edit variant only — default exercise prescription fields (string form values) */
  defaultSets: string;
  defaultReps: string;
  defaultDurationSeconds: string;
  defaultRestSeconds: string;
  defaultNotes: string;
}
