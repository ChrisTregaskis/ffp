import type { CreateVideoInput } from '@ffp/core';

/** Internal form values for the video metadata form */
export interface VideoMetadataFormValues {
  title: string;
  description: string;
  movementType: NonNullable<CreateVideoInput['movementType']> | '';
  difficulty: NonNullable<CreateVideoInput['difficulty']> | '';
  bodyParts: string[];
  equipment: string[];
  tags: string[];
}
