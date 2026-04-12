import type { ProgrammeDetailResponse } from '@ffp/core';

/** Types derived from programme detail API response */
type DetailPhase = ProgrammeDetailResponse['phases'][number];
type DetailSession = DetailPhase['sessions'][number];
export type DetailExercise = NonNullable<DetailSession['exercises']>[number];

/** Flat exercise view model for session components */
export interface SessionExercise {
  /** Exercise completion ID (from completion record) */
  completionId: string;
  /** Video ID for signed URL lookup */
  videoId: string;
  /** Exercise title (from video) */
  title: string;
  /** Prescription fields (from session_exercises) */
  sets: number;
  reps: string;
  restSeconds: number | null;
  durationSeconds: number | null;
  notes: string | null;
  /** Whether this exercise is completed */
  completed: boolean;
}

/** Map a detail exercise from the API to a flat SessionExercise for components */
export const toSessionExercise = (exercise: DetailExercise): SessionExercise => ({
  completionId: exercise.completion?.id ?? exercise.sessionExerciseId,
  videoId: exercise.video.id,
  title: exercise.video.title,
  sets: exercise.sets,
  reps: exercise.reps,
  restSeconds: exercise.restSeconds,
  durationSeconds: exercise.durationSeconds,
  notes: exercise.notes,
  completed: exercise.completion?.completed ?? false,
});
