import type {
  CreateExerciseRequest,
  ExerciseResponse,
  UpdateExerciseRequest,
  VideoDetailResponse,
} from '@ffp/core';

import { fieldToNumber, numberToField } from '@web/utils/form-number';

export interface ExerciseFormValues {
  videoId: string;
  sets: string;
  reps: string;
  durationSeconds: string;
  restSeconds: string;
  notes: string;
}

export const EMPTY_EXERCISE_VALUES: ExerciseFormValues = {
  videoId: '',
  sets: '',
  reps: '',
  durationSeconds: '',
  restSeconds: '',
  notes: '',
};

/** The stored exercise a form edits: a template exercise, or a member's own copy of one */
export type StoredExercise = Pick<
  ExerciseResponse,
  'videoId' | 'sets' | 'reps' | 'durationSeconds' | 'restSeconds' | 'notes'
>;

/** Prescription fields a chosen video's defaults can set */
export const PRESCRIPTION_FIELDS = [
  'sets',
  'reps',
  'durationSeconds',
  'restSeconds',
  'notes',
] as const;

export type PrescriptionField = (typeof PRESCRIPTION_FIELDS)[number];

const REQUIRED_FIELDS: readonly PrescriptionField[] = ['sets', 'reps'];

/**
 * `fill-empty` sets only the fields still blank, so a prescription typed first survives the
 * choice of video. `overwrite` replaces the prescription with the new video's, for a swap.
 */
export type PrescriptionOnVideoChange = 'fill-empty' | 'overwrite';

/**
 * The prescription fields after choosing a video. On overwrite, a video with no default clears an
 * optional field but keeps sets and reps, which an exercise cannot store blank.
 */
export const prescriptionFromVideo = (
  video: Pick<
    VideoDetailResponse,
    'defaultSets' | 'defaultReps' | 'defaultDurationSeconds' | 'defaultRestSeconds' | 'defaultNotes'
  >,
  current: ExerciseFormValues,
  mode: PrescriptionOnVideoChange
): Pick<ExerciseFormValues, PrescriptionField> => {
  const defaults: Record<PrescriptionField, string> = {
    sets: numberToField(video.defaultSets),
    reps: video.defaultReps ?? '',
    durationSeconds: numberToField(video.defaultDurationSeconds),
    restSeconds: numberToField(video.defaultRestSeconds),
    notes: video.defaultNotes ?? '',
  };
  const choose = (field: PrescriptionField): string => {
    if (mode === 'fill-empty') {
      return current[field] || defaults[field];
    }

    return defaults[field] || (REQUIRED_FIELDS.includes(field) ? current[field] : '');
  };

  return {
    sets: choose('sets'),
    reps: choose('reps'),
    durationSeconds: choose('durationSeconds'),
    restSeconds: choose('restSeconds'),
    notes: choose('notes'),
  };
};

/** Builds initial form values from a stored exercise for editing. */
export const exerciseToFormValues = (exercise: StoredExercise): ExerciseFormValues => ({
  videoId: exercise.videoId,
  sets: String(exercise.sets),
  reps: exercise.reps,
  durationSeconds: numberToField(exercise.durationSeconds),
  restSeconds: numberToField(exercise.restSeconds),
  notes: exercise.notes ?? '',
});

/** A blank prescription field is left out, so the server fills it from the video's defaults */
export const toCreateExerciseRequest = (values: ExerciseFormValues): CreateExerciseRequest => ({
  videoId: values.videoId,
  sets: fieldToNumber(values.sets),
  reps: values.reps || undefined,
  durationSeconds: fieldToNumber(values.durationSeconds),
  restSeconds: fieldToNumber(values.restSeconds),
  notes: values.notes || undefined,
});

/**
 * Only the fields that differ from the stored exercise; an empty object means nothing changed.
 * A blank optional field clears it with null. Sets and reps are required on edit, so a blank
 * one never reaches here.
 */
export const toUpdateExerciseRequest = (
  values: ExerciseFormValues,
  exercise: StoredExercise
): UpdateExerciseRequest => {
  const payload: UpdateExerciseRequest = {};

  if (values.videoId !== exercise.videoId) {
    payload.videoId = values.videoId;
  }

  const sets = fieldToNumber(values.sets);

  if (sets !== undefined && sets !== exercise.sets) {
    payload.sets = sets;
  }

  if (values.reps && values.reps !== exercise.reps) {
    payload.reps = values.reps;
  }

  const durationSeconds = fieldToNumber(values.durationSeconds) ?? null;

  if (durationSeconds !== exercise.durationSeconds) {
    payload.durationSeconds = durationSeconds;
  }

  const restSeconds = fieldToNumber(values.restSeconds) ?? null;

  if (restSeconds !== exercise.restSeconds) {
    payload.restSeconds = restSeconds;
  }

  const notes = values.notes || null;

  if (notes !== exercise.notes) {
    payload.notes = notes;
  }

  return payload;
};
