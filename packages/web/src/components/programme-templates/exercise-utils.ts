import type { ExerciseResponse } from '@ffp/core';

import { numberToField } from '@web/utils/form-number';

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
