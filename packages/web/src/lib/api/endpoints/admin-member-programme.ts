import { z } from 'zod';

import type {
  CreateExerciseRequest,
  MemberExerciseResponse,
  MemberSessionOrderResponse,
  UpdateExerciseRequest,
} from '@ffp/core';
import { memberExerciseResponseSchema, memberSessionOrderResponseSchema } from '@ffp/core';

import { assertUuidPathParam, ffpClient, parseApiResponse } from '../client';

const exerciseEnvelope = z.object({ exercise: memberExerciseResponseSchema });
const exercisesEnvelope = z.object({ exercises: z.array(memberExerciseResponseSchema) });
const sessionsEnvelope = z.object({ sessions: z.array(memberSessionOrderResponseSchema) });

/** The member by publicId; their sessions, exercises and phases by the UUIDs on the programme read. */
const programmePath = (publicId: string): string => `/admin/users/${publicId}/programme`;

/** An admin's edits to one member's own programme. These endpoints require system_admin role. */
export const adminMemberProgrammeApi = {
  /** Adds an exercise to the end of a session the member has not started. */
  addExercise: async (
    publicId: string,
    sessionId: string,
    data: CreateExerciseRequest
  ): Promise<MemberExerciseResponse> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'POST /admin/users/{id}/programme/sessions/{sessionId}/exercises'
    );
    const path = `${programmePath(publicId)}/sessions/${checkedSessionId}/exercises`;
    const response = await ffpClient.post(path, data);

    return parseApiResponse(exerciseEnvelope, response, { method: 'POST', path }).exercise;
  },

  /** Changes an exercise's video, prescription or both. */
  updateExercise: async (
    publicId: string,
    exerciseId: string,
    data: UpdateExerciseRequest
  ): Promise<MemberExerciseResponse> => {
    const checkedExerciseId = assertUuidPathParam(
      exerciseId,
      'PUT /admin/users/{id}/programme/exercises/{exerciseId}'
    );
    const path = `${programmePath(publicId)}/exercises/${checkedExerciseId}`;
    const response = await ffpClient.put(path, data);

    return parseApiResponse(exerciseEnvelope, response, { method: 'PUT', path }).exercise;
  },

  /** Removes an exercise; a session's last one is refused. */
  removeExercise: async (publicId: string, exerciseId: string): Promise<void> => {
    const checkedExerciseId = assertUuidPathParam(
      exerciseId,
      'DELETE /admin/users/{id}/programme/exercises/{exerciseId}'
    );
    await ffpClient.delete(`${programmePath(publicId)}/exercises/${checkedExerciseId}`);
  },

  /** Puts a session's exercises in the given order. */
  reorderExercises: async (
    publicId: string,
    sessionId: string,
    orderedIds: string[]
  ): Promise<MemberExerciseResponse[]> => {
    const checkedSessionId = assertUuidPathParam(
      sessionId,
      'PUT /admin/users/{id}/programme/sessions/{sessionId}/exercises/reorder'
    );
    const path = `${programmePath(publicId)}/sessions/${checkedSessionId}/exercises/reorder`;
    const response = await ffpClient.put(path, { orderedIds });

    return parseApiResponse(exercisesEnvelope, response, { method: 'PUT', path }).exercises;
  },

  /** Puts a phase's sessions in the given order; only those not started may move. */
  reorderSessions: async (
    publicId: string,
    phaseId: string,
    orderedIds: string[]
  ): Promise<MemberSessionOrderResponse[]> => {
    const checkedPhaseId = assertUuidPathParam(
      phaseId,
      'PUT /admin/users/{id}/programme/phases/{phaseId}/sessions/reorder'
    );
    const path = `${programmePath(publicId)}/phases/${checkedPhaseId}/sessions/reorder`;
    const response = await ffpClient.put(path, { orderedIds });

    return parseApiResponse(sessionsEnvelope, response, { method: 'PUT', path }).sessions;
  },
};
