import type { CreateVideoInput } from '@ffp/core';

/** User-entered metadata values from the form (no upload-derived fields) */
export interface VideoMetadataValues {
  title: string;
  description?: string;
  movementType?: CreateVideoInput['movementType'];
  difficulty?: CreateVideoInput['difficulty'];
  bodyParts: string[];
  equipment: string[];
  tags: string[];
}
