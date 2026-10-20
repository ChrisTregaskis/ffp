import type { UpdateVideoInput, VideoDetailResponse, VideoStatus } from '@ffp/core';

import { fieldToNumber, numberToField } from '@web/utils/form-number';

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

const arraysEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// A blank prescription field clears the stored value, which takes null rather than undefined
const toNumberOrNull = (value: string): number | null => fieldToNumber(value) ?? null;
const toStringOrNull = (value: string): string | null => value || null;

/** Only the fields that differ from the stored video; an empty object means nothing changed. */
export const toUpdateVideoInput = (
  values: VideoEditFormValues,
  video: VideoDetailResponse
): UpdateVideoInput => {
  const payload: UpdateVideoInput = {};

  if (values.title !== video.title) {
    payload.title = values.title;
  }

  const descValue = values.description || null;

  if (descValue !== (video.description ?? null)) {
    payload.description = descValue;
  }

  const movementValue = values.movementType || null;

  if (movementValue !== (video.movementType ?? null)) {
    payload.movementType = movementValue as UpdateVideoInput['movementType'];
  }

  const diffValue = values.difficulty || null;

  if (diffValue !== (video.difficulty ?? null)) {
    payload.difficulty = diffValue as UpdateVideoInput['difficulty'];
  }

  if (values.status !== video.status) {
    payload.status = values.status as VideoStatus;
  }

  if (!arraysEqual(values.bodyParts, video.bodyParts)) {
    payload.bodyParts = values.bodyParts;
  }

  if (!arraysEqual(values.equipment, video.equipment)) {
    payload.equipment = values.equipment;
  }

  if (!arraysEqual(values.tags, video.tags)) {
    payload.tags = values.tags;
  }

  const newSets = toNumberOrNull(values.defaultSets);

  if (newSets !== (video.defaultSets ?? null)) {
    payload.defaultSets = newSets;
  }

  const newReps = toStringOrNull(values.defaultReps);

  if (newReps !== (video.defaultReps ?? null)) {
    payload.defaultReps = newReps;
  }

  const newDuration = toNumberOrNull(values.defaultDurationSeconds);

  if (newDuration !== (video.defaultDurationSeconds ?? null)) {
    payload.defaultDurationSeconds = newDuration;
  }

  const newRest = toNumberOrNull(values.defaultRestSeconds);

  if (newRest !== (video.defaultRestSeconds ?? null)) {
    payload.defaultRestSeconds = newRest;
  }

  const newNotes = toStringOrNull(values.defaultNotes);

  if (newNotes !== (video.defaultNotes ?? null)) {
    payload.defaultNotes = newNotes;
  }

  return payload;
};
