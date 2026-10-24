import type { CreateVideoInput, VideoTagAssignment } from '@ffp/core';

/** User-entered metadata values from the form (no upload-derived fields) */
export interface VideoMetadataValues {
  title: string;
  description?: string;
  difficulty?: CreateVideoInput['difficulty'];
  equipment: string[];
  isEssential: boolean;
  tags: VideoTagAssignment;
}
