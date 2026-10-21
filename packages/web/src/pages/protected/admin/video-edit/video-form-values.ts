import type { AdminVideoDetail, TagSummary, UpdateVideoInput, VideoStatus } from '@ffp/core';

import { fieldToNumber, numberToField } from '@web/utils/form-number';

import type { VideoEditFormValues } from './types';

const toPublicIds = (tags: TagSummary[]): string[] => tags.map((tag) => tag.publicId);

export const toVideoFormValues = (video: AdminVideoDetail): VideoEditFormValues => ({
  title: video.title,
  description: video.description ?? '',
  difficulty: video.difficulty ?? '',
  status: video.status,
  movementTags: toPublicIds(video.tags.movement),
  bodyAreaTags: toPublicIds(video.tags['body-area']),
  equipment: video.equipment,
  defaultSets: numberToField(video.defaultSets),
  defaultReps: video.defaultReps ?? '',
  defaultDurationSeconds: numberToField(video.defaultDurationSeconds),
  defaultRestSeconds: numberToField(video.defaultRestSeconds),
  defaultNotes: video.defaultNotes ?? '',
});

const arraysEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// Tags are a set: ticking in a different order is no change
const sameMembers = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value) => b.includes(value));

// A blank prescription field clears the stored value, which takes null rather than undefined
const toNumberOrNull = (value: string): number | null => fieldToNumber(value) ?? null;
const toStringOrNull = (value: string): string | null => value || null;

/** Only the fields that differ from the stored video; an empty object means nothing changed. */
export const toUpdateVideoInput = (
  values: VideoEditFormValues,
  video: AdminVideoDetail
): UpdateVideoInput => {
  const payload: UpdateVideoInput = {};

  if (values.title !== video.title) {
    payload.title = values.title;
  }

  const descValue = values.description || null;

  if (descValue !== (video.description ?? null)) {
    payload.description = descValue;
  }

  const diffValue = values.difficulty || null;

  if (diffValue !== (video.difficulty ?? null)) {
    payload.difficulty = diffValue as UpdateVideoInput['difficulty'];
  }

  if (values.status !== video.status) {
    payload.status = values.status as VideoStatus;
  }

  if (!arraysEqual(values.equipment, video.equipment)) {
    payload.equipment = values.equipment;
  }

  // Only the categories the form edits are sent, so the video's other tags are left alone
  if (!sameMembers(values.movementTags, toPublicIds(video.tags.movement))) {
    payload.tags = { ...payload.tags, movement: values.movementTags };
  }

  if (!sameMembers(values.bodyAreaTags, toPublicIds(video.tags['body-area']))) {
    payload.tags = { ...payload.tags, 'body-area': values.bodyAreaTags };
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

/** An edit that archives the video, which the page confirms before saving */
export const archivesVideo = (values: VideoEditFormValues, video: AdminVideoDetail): boolean =>
  toUpdateVideoInput(values, video).status === 'archived';
