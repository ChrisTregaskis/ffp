import type { StoredExercise } from '@web/components/programme-templates';

import type { ProgrammeExercise } from './ProgrammeExerciseRow';

/** A member's exercise in the shape the exercise form edits and diffs against */
export const toStoredExercise = (exercise: ProgrammeExercise): StoredExercise => ({
  ...exercise,
  videoId: exercise.video.id,
});
