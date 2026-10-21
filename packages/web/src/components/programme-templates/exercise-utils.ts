import type { CreateExerciseRequest, ExerciseResponse, UpdateExerciseRequest } from '@ffp/core';

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

/** Builds initial form values from an ExerciseResponse for editing. */
export const exerciseToFormValues = (exercise: ExerciseResponse): ExerciseFormValues => ({
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
  exercise: ExerciseResponse
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
