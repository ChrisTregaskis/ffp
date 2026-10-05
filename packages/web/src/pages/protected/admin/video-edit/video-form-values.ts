import type { VideoDetailResponse } from '@ffp/core';

import { numberToField } from '@web/utils/form-number';

import type { VideoEditFormValues } from './types';

export const toVideoFormValues = (video: VideoDetailResponse): VideoEditFormValues => ({
  title: video.title,
  description: video.description ?? '',
  movementType: video.movementType ?? '',
  difficulty: video.difficulty ?? '',
  status: video.status,
  bodyParts: video.bodyParts,
  equipment: video.equipment,
  tags: video.tags,
  defaultSets: numberToField(video.defaultSets),
  defaultReps: video.defaultReps ?? '',
  defaultDurationSeconds: numberToField(video.defaultDurationSeconds),
  defaultRestSeconds: numberToField(video.defaultRestSeconds),
  defaultNotes: video.defaultNotes ?? '',
});
