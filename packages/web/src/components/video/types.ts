import type { CreateVideoInput, TagCategorySlug } from '@ffp/core';

/** Internal form values for the video metadata form (all variants) */
export interface VideoMetadataFormValues {
  title: string;
  description: string;
  difficulty: NonNullable<CreateVideoInput['difficulty']> | '';
  /** Tag publicIds per category */
  tags: Record<TagCategorySlug, string[]>;
  /** A core exercise, favoured over the rest of its pool */
  isEssential: boolean;
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
