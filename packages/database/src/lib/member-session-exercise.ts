import type { NewUserSessionExercise, SessionExerciseRecord, VideoRecord } from '../schema';

/** A member exercise row, short of the organisation and member session it is written under */
export type MemberSessionExerciseFields = Omit<
  NewUserSessionExercise,
  'organisationId' | 'userSessionId'
>;

/** A template session's fixed exercise, copied as prescribed */
export function fromTemplateExercise(exercise: SessionExerciseRecord): MemberSessionExerciseFields {
  return {
    sourceSessionExerciseId: exercise.id,
    videoId: exercise.videoId,
    orderIndex: exercise.orderIndex,
    sets: exercise.sets,
    reps: exercise.reps,
    durationSeconds: exercise.durationSeconds,
    restSeconds: exercise.restSeconds,
    notes: exercise.notes,
  };
}

/**
 * A video drawn for a slot, prescribed by its defaults. Sets and reps have column defaults, so a
 * missing default is left out for the column to fill rather than repeated here.
 */
export function fromDrawnVideo(
  video: VideoRecord,
  orderIndex: number
): MemberSessionExerciseFields {
  return {
    sourceSessionExerciseId: null,
    videoId: video.id,
    orderIndex,
    sets: video.defaultSets ?? undefined,
    reps: video.defaultReps ?? undefined,
    durationSeconds: video.defaultDurationSeconds,
    restSeconds: video.defaultRestSeconds,
    notes: video.defaultNotes,
  };
}
