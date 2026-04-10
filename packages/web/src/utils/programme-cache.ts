import type { ProgrammeDetailResponse } from '@ffp/core';

type DetailPhase = ProgrammeDetailResponse['phases'][number];
type DetailSession = DetailPhase['sessions'][number];
type DetailExercise = NonNullable<DetailSession['exercises']>[number];

/** Toggle a single exercise's completion status */
const toggleExerciseCompletion = (
  exercise: DetailExercise,
  completionId: string,
  completed: boolean
): DetailExercise => {
  if (exercise.completion?.id !== completionId) {
    return exercise;
  }

  return {
    ...exercise,
    completion: {
      ...exercise.completion,
      completed,
      completedAt: completed ? new Date() : null,
    },
  };
};

/** Update exercises within a session */
const updateSessionExercises = (
  session: DetailSession,
  completionId: string,
  completed: boolean
): DetailSession => ({
  ...session,
  exercises: session.exercises?.map((exercise) =>
    toggleExerciseCompletion(exercise, completionId, completed)
  ),
});

/**
 * Apply an optimistic exercise completion toggle to the programme detail cache.
 *
 * Immutably walks the nested programme → phases → sessions → exercises structure
 * and toggles the matching exercise's completion status.
 */
export const applyOptimisticExerciseToggle = (
  detail: ProgrammeDetailResponse,
  completionId: string,
  completed: boolean
): ProgrammeDetailResponse => ({
  ...detail,
  phases: detail.phases.map((phase) => ({
    ...phase,
    sessions: phase.sessions.map((session) =>
      updateSessionExercises(session, completionId, completed)
    ),
  })),
});
