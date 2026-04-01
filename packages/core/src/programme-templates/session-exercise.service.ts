import { getDb } from '@ffp/database';

import { NotFoundError, ValidationError } from '../lib/errors';
import {
  createExerciseRequestSchema,
  updateExerciseRequestSchema,
  reorderExercisesRequestSchema,
  exerciseResponseSchema,
} from '../schemas/programme/programme.schema';
import * as videoRepository from '../videos/video.repository';

import * as exerciseRepository from './session-exercise.repository';
import * as sessionRepository from './template-session.repository';

import type { ExerciseWithVideo } from './session-exercise.repository';
import type { ExerciseResponse } from '../schemas/programme/programme.schema';

/** Maps an exercise-with-video row to the API response shape. */
const toResponse = (record: ExerciseWithVideo): ExerciseResponse =>
  exerciseResponseSchema.parse(record);

/** Returns all exercises for a session, ordered by orderIndex. */
export async function listExercises(sessionId: string): Promise<ExerciseResponse[]> {
  const db = getDb();

  const session = await sessionRepository.findSessionById(db, sessionId);

  if (!session) {
    throw new NotFoundError('Template session', sessionId);
  }

  const exercises = await exerciseRepository.findExercisesBySessionId(db, sessionId);

  return exercises.map(toResponse);
}

/**
 * Creates a new exercise within a session.
 * Pre-populates prescription fields from video defaults when not explicitly provided.
 * Auto-assigns orderIndex.
 */
export async function createExercise(sessionId: string, input: unknown): Promise<ExerciseResponse> {
  const validated = createExerciseRequestSchema.parse(input);
  const db = getDb();

  // Validate session exists
  const session = await sessionRepository.findSessionById(db, sessionId);

  if (!session) {
    throw new NotFoundError('Template session', sessionId);
  }

  // Validate video exists and is active (outside transaction — video repo uses DbClient)
  const video = await videoRepository.findVideoById(db, validated.videoId);

  if (!video) {
    throw new ValidationError('Video not found');
  }

  if (video.status !== 'active') {
    throw new ValidationError('Video is not active');
  }

  // Pre-populate prescription from video defaults where not explicitly provided
  const prescription = {
    ...validated,
    sets: validated.sets ?? video.defaultSets ?? 3,
    reps: validated.reps ?? video.defaultReps ?? '10',
    durationSeconds: validated.durationSeconds ?? video.defaultDurationSeconds ?? null,
    restSeconds: validated.restSeconds ?? video.defaultRestSeconds ?? null,
    notes: validated.notes ?? video.defaultNotes ?? null,
  };

  const exercise = await exerciseRepository.insertExercise(db, sessionId, prescription);

  // Build response from insert result + already-fetched video data
  return toResponse({
    ...exercise,
    video: {
      id: video.id,
      title: video.title,
      thumbnailKey: video.thumbnailKey,
      status: video.status,
    },
  });
}

/** Updates an exercise. Validates video if videoId is changed. */
export async function updateExercise(
  exerciseId: string,
  input: unknown
): Promise<ExerciseResponse> {
  const validated = updateExerciseRequestSchema.parse(input);
  const db = getDb();

  // Validate video if changing reference
  if (validated.videoId) {
    const video = await videoRepository.findVideoById(db, validated.videoId);

    if (!video) {
      throw new ValidationError('Video not found');
    }

    if (video.status !== 'active') {
      throw new ValidationError('Video is not active');
    }
  }

  const updated = await exerciseRepository.updateExercise(db, exerciseId, validated);

  if (!updated) {
    throw new NotFoundError('Session exercise', exerciseId);
  }

  // Fetch with video join for the response
  const withVideo = await exerciseRepository.findExerciseById(db, updated.id);

  if (!withVideo) {
    throw new NotFoundError('Session exercise', updated.id);
  }

  return toResponse(withVideo);
}

/**
 * Deletes an exercise and re-numbers remaining exercises
 * to maintain a contiguous 0-based orderIndex sequence.
 */
export async function deleteExercise(exerciseId: string): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    const exercise = await exerciseRepository.findExerciseById(tx, exerciseId);

    if (!exercise) {
      throw new NotFoundError('Session exercise', exerciseId);
    }

    await exerciseRepository.deleteExercise(tx, exerciseId);
    await exerciseRepository.renumberExercises(tx, exercise.templateSessionId);
  });
}

/**
 * Reorders exercises within a session.
 * Validates all provided IDs belong to the session before reordering.
 */
export async function reorderExercises(
  sessionId: string,
  input: unknown
): Promise<ExerciseResponse[]> {
  const validated = reorderExercisesRequestSchema.parse(input);
  const db = getDb();

  const reordered = await db.transaction(async (tx) => {
    const session = await sessionRepository.findSessionById(tx, sessionId);

    if (!session) {
      throw new NotFoundError('Template session', sessionId);
    }

    // Validate all IDs belong to this session
    const existingExercises = await exerciseRepository.findExercisesBySessionId(tx, sessionId);
    const existingIds = new Set(existingExercises.map((e) => e.id));

    const invalidIds = validated.orderedIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      throw new ValidationError('One or more exercise IDs do not belong to this session');
    }

    if (validated.orderedIds.length !== existingExercises.length) {
      throw new ValidationError(
        `Expected ${String(existingExercises.length)} exercise IDs but received ${String(validated.orderedIds.length)}`
      );
    }

    return await exerciseRepository.reorderExercises(tx, sessionId, validated.orderedIds);
  });

  return reordered.map(toResponse);
}
