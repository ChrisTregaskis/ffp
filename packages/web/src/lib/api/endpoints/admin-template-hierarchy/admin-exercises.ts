import { z } from 'zod';

import type {
  CreateExerciseRequest,
  ExerciseResponse,
  ReorderExercisesRequest,
  UpdateExerciseRequest,
} from '@ffp/core';
import { exerciseResponseSchema } from '@ffp/core';

import { assertUuidPathParam, ffpClient, parseApiResponse } from '../../client';

const exerciseResponseEnvelope = z.object({ exercise: exerciseResponseSchema });
const exercisesResponseEnvelope = z.object({ exercises: z.array(exerciseResponseSchema) });

/** Exercise CRUD + reorder within a template session. */
export const adminExercisesApi = {
  /** Lists exercises for a session with video summaries. */
  list: async (sessionId: string): Promise<ExerciseResponse[]> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'GET /admin/sessions/{sessionId}/exercises'
    );
    const path = `/admin/sessions/${checkedSessionId}/exercises`;
    const response = await ffpClient.get(path);

    return parseApiResponse(exercisesResponseEnvelope, response, { method: 'GET', path }).exercises;
  },

  /** Creates a new exercise within a session. */
  create: async (sessionId: string, data: CreateExerciseRequest): Promise<ExerciseResponse> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'POST /admin/sessions/{sessionId}/exercises'
    );
    const path = `/admin/sessions/${checkedSessionId}/exercises`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(exerciseResponseEnvelope, response, { method: 'POST', path }).exercise;
  },

  /** Updates an exercise (partial update). */
  update: async (exerciseId: string, data: UpdateExerciseRequest): Promise<ExerciseResponse> => {
    const checkedExerciseId = assertUuidPathParam(exerciseId, 'PUT /admin/exercises/{exerciseId}');
    const path = `/admin/exercises/${checkedExerciseId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(exerciseResponseEnvelope, response, { method: 'PUT', path }).exercise;
  },

  /** Deletes an exercise and renumbers siblings. */
  delete: async (exerciseId: string): Promise<void> => {
    const checkedExerciseId = assertUuidPathParam(
      exerciseId,
      'DELETE /admin/exercises/{exerciseId}'
    );
    const path = `/admin/exercises/${checkedExerciseId}`;
    await ffpClient.delete(path);
  },

  /** Reorders exercises within a session. */
  reorder: async (
    sessionId: string,
    data: ReorderExercisesRequest
  ): Promise<ExerciseResponse[]> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'PUT /admin/sessions/{sessionId}/exercises/reorder'
    );
    const path = `/admin/sessions/${checkedSessionId}/exercises/reorder`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(exercisesResponseEnvelope, response, { method: 'PUT', path }).exercises;
  },
};

export type {
  CreateExerciseRequest,
  ExerciseResponse,
  ReorderExercisesRequest,
  UpdateExerciseRequest,
};
