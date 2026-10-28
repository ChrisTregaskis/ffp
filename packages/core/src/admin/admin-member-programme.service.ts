import { fromDrawnVideo, getDb, withAdminContext } from '@ffp/database';
import type { SessionStatus } from '@ffp/database/constants';

import { withRLS, type Transaction } from '../lib/database';
import { assertDistinctIds } from '../lib/distinct-ids';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import { findCurrentProgrammeInTx } from '../programmes/programme.repository';
import {
  createExerciseRequestSchema,
  memberExerciseResponseSchema,
  memberSessionOrderResponseSchema,
  reorderExercisesRequestSchema,
  reorderSessionsRequestSchema,
  updateExerciseRequestSchema,
} from '../schemas/programme/programme.schema';
import * as sessionRepository from '../sessions/session.repository';
import * as exerciseRepository from '../sessions/user-session-exercise.repository';
import { findExerciseVideo } from '../videos/video.service';

import { getUserByPublicId as getUserByPublicIdInRepo } from './admin-user.repository';

import type { OrganisationContext } from '../lib/context';
import type {
  MemberExerciseResponse,
  MemberSessionOrderResponse,
} from '../schemas/programme/programme.schema';
import type { UserSessionRecord } from '../sessions/session.repository';
import type { UserSessionExerciseRecord } from '../sessions/user-session-exercise.repository';

/** The member whose programme an edit runs under, taken from their row and never the request */
interface Member {
  id: string;
  organisationId: string;
}

const LOCKED_SESSION_REASONS: Record<Exclude<SessionStatus, 'not_started'>, string> = {
  in_progress: 'This session is under way, so it can no longer be changed.',
  completed: 'This session is completed, so it can no longer be changed.',
  skipped: 'This session was skipped, so it can no longer be changed.',
};

/**
 * Runs an edit inside one transaction under the member's own organisation, with their current
 * programme resolved. The user is found under admin context; nothing below `programmes` needs an
 * admin bypass. RLS isolates organisations only, so every target is then matched to this
 * programme, which is what keeps one member's ids off another member's routes.
 */
async function editMemberProgramme<T>(
  publicId: string,
  edit: (tx: Transaction, programmeId: string, member: Member) => Promise<T>
): Promise<{ result: T; member: Member }> {
  const user = await withAdminContext(getDb(), async (tx) => {
    return await getUserByPublicIdInRepo(tx, publicId);
  });

  if (!user) {
    throw new NotFoundError('User', publicId);
  }

  const member = { id: user.id, organisationId: user.organisationId };

  const result = await withRLS(member.organisationId, member.id, async (tx) => {
    const programme = await findCurrentProgrammeInTx(tx, member.organisationId, member.id);

    if (!programme) {
      throw new NotFoundError('Active programme');
    }

    return await edit(tx, programme.id, member);
  });

  return { result, member };
}

/** Only a session the member has not started can change: a start copies its exercises. */
function assertEditable(session: UserSessionRecord): void {
  if (session.status !== 'not_started') {
    throw new ConflictError(LOCKED_SESSION_REASONS[session.status]);
  }
}

async function findEditableSession(
  tx: Transaction,
  programmeId: string,
  sessionId: string
): Promise<UserSessionRecord> {
  const session = await sessionRepository.lockUserSessionInProgramme(tx, programmeId, sessionId);

  if (!session) {
    throw new NotFoundError('Session', sessionId);
  }

  assertEditable(session);

  return session;
}

/** The exercise is matched to the programme through its session, which is locked as above. */
async function findEditableExercise(
  tx: Transaction,
  programmeId: string,
  exerciseId: string
): Promise<UserSessionExerciseRecord> {
  const found = await exerciseRepository.findUserSessionExerciseById(tx, exerciseId);
  const session = found
    ? await sessionRepository.lockUserSessionInProgramme(tx, programmeId, found.userSessionId)
    : null;
  // Read again under the lock: a concurrent edit may have removed it while this one waited
  const exercise = session
    ? await exerciseRepository.findUserSessionExerciseById(tx, exerciseId)
    : null;

  if (!session || !exercise) {
    throw new NotFoundError('Session exercise', exerciseId);
  }

  assertEditable(session);

  return exercise;
}

/**
 * Adds an exercise to the end of a member's session. A prescription field left out takes the
 * video's default, as a drawn exercise does.
 */
export async function addMemberExerciseService(
  ctx: OrganisationContext,
  publicId: string,
  sessionId: string,
  input: unknown
): Promise<MemberExerciseResponse> {
  const validated = createExerciseRequestSchema.parse(input);

  const { result: exercise, member } = await editMemberProgramme(
    publicId,
    async (tx, programmeId, { organisationId }) => {
      const session = await findEditableSession(tx, programmeId, sessionId);
      const video = await findExerciseVideo(tx, validated.videoId);
      const existing = await exerciseRepository.findUserSessionExercisesBySessionId(tx, session.id);
      const nextOrderIndex = Math.max(-1, ...existing.map((row) => row.orderIndex)) + 1;
      const defaults = fromDrawnVideo(video, nextOrderIndex);

      const [created] = await exerciseRepository.createUserSessionExercises(tx, [
        {
          ...defaults,
          organisationId,
          userSessionId: session.id,
          sets: validated.sets ?? defaults.sets,
          reps: validated.reps ?? defaults.reps,
          durationSeconds: validated.durationSeconds ?? defaults.durationSeconds,
          restSeconds: validated.restSeconds ?? defaults.restSeconds,
          notes: validated.notes ?? defaults.notes,
        },
      ]);

      return created;
    }
  );

  createLogger(ctx).info('Member exercise added', {
    action: 'member_exercise_added',
    publicId,
    organisationId: member.organisationId,
    userSessionId: sessionId,
    userSessionExerciseId: exercise.id,
  });

  return memberExerciseResponseSchema.parse(exercise);
}

/** Changes a member exercise's video, prescription or both. */
export async function updateMemberExerciseService(
  ctx: OrganisationContext,
  publicId: string,
  exerciseId: string,
  input: unknown
): Promise<MemberExerciseResponse> {
  const validated = updateExerciseRequestSchema.parse(input);

  const { result: exercise, member } = await editMemberProgramme(
    publicId,
    async (tx, programmeId) => {
      const target = await findEditableExercise(tx, programmeId, exerciseId);
      const swapsVideo = validated.videoId !== undefined && validated.videoId !== target.videoId;

      if (validated.videoId) {
        await findExerciseVideo(tx, validated.videoId);
      }

      // Another video is no longer a copy of the template exercise the row came from
      const updated = await exerciseRepository.updateUserSessionExercise(
        tx,
        exerciseId,
        swapsVideo ? { ...validated, sourceSessionExerciseId: null } : validated
      );

      if (!updated) {
        throw new NotFoundError('Session exercise', exerciseId);
      }

      return updated;
    }
  );

  createLogger(ctx).info('Member exercise updated', {
    action: 'member_exercise_updated',
    publicId,
    organisationId: member.organisationId,
    userSessionId: exercise.userSessionId,
    userSessionExerciseId: exercise.id,
  });

  return memberExerciseResponseSchema.parse(exercise);
}

/**
 * Removes an exercise from a member's session and closes the gap in the order. A session's last
 * exercise stays: an empty session has nothing to complete, so it could never finish.
 */
export async function removeMemberExerciseService(
  ctx: OrganisationContext,
  publicId: string,
  exerciseId: string
): Promise<void> {
  const { result: userSessionId, member } = await editMemberProgramme(
    publicId,
    async (tx, programmeId) => {
      const target = await findEditableExercise(tx, programmeId, exerciseId);

      const exercises = await exerciseRepository.findUserSessionExercisesBySessionId(
        tx,
        target.userSessionId
      );

      if (exercises.length <= 1) {
        throw new ConflictError(
          "A session needs at least one exercise, so its last one can't be removed."
        );
      }

      await exerciseRepository.deleteUserSessionExercise(tx, exerciseId);
      await exerciseRepository.renumberUserSessionExercises(tx, target.userSessionId);

      return target.userSessionId;
    }
  );

  createLogger(ctx).info('Member exercise removed', {
    action: 'member_exercise_removed',
    publicId,
    organisationId: member.organisationId,
    userSessionId,
    userSessionExerciseId: exerciseId,
  });
}

/** Puts a member session's exercises in the given order; every exercise, each once. */
export async function reorderMemberExercisesService(
  ctx: OrganisationContext,
  publicId: string,
  sessionId: string,
  input: unknown
): Promise<MemberExerciseResponse[]> {
  const { orderedIds } = reorderExercisesRequestSchema.parse(input);
  assertDistinctIds(orderedIds, 'Exercise');

  const { result: exercises, member } = await editMemberProgramme(
    publicId,
    async (tx, programmeId) => {
      const session = await findEditableSession(tx, programmeId, sessionId);
      const existing = await exerciseRepository.findUserSessionExercisesBySessionId(tx, session.id);
      const existingIds = new Set(existing.map((row) => row.id));

      if (orderedIds.some((id) => !existingIds.has(id))) {
        throw new ValidationError('One or more exercise IDs do not belong to this session');
      }

      if (orderedIds.length !== existing.length) {
        throw new ValidationError(
          `Expected ${String(existing.length)} exercise IDs but received ${String(orderedIds.length)}`
        );
      }

      return await exerciseRepository.reorderUserSessionExercises(tx, session.id, orderedIds);
    }
  );

  createLogger(ctx).info('Member exercises reordered', {
    action: 'member_exercises_reordered',
    publicId,
    organisationId: member.organisationId,
    userSessionId: sessionId,
  });

  return exercises.map((exercise) => memberExerciseResponseSchema.parse(exercise));
}

/**
 * Puts a member phase's sessions in the given order; every session, each once. A session the
 * member has started, completed or skipped keeps its place, so only those not yet started move
 * among themselves and the member's "next session" still follows the order.
 */
export async function reorderMemberSessionsService(
  ctx: OrganisationContext,
  publicId: string,
  phaseId: string,
  input: unknown
): Promise<MemberSessionOrderResponse[]> {
  const { orderedIds } = reorderSessionsRequestSchema.parse(input);
  assertDistinctIds(orderedIds, 'Session');

  const { result: sessions, member } = await editMemberProgramme(
    publicId,
    async (tx, programmeId) => {
      const phase = await sessionRepository.findProgrammePhaseById(tx, phaseId);

      if (phase?.programmeId !== programmeId) {
        throw new NotFoundError('Programme phase', phaseId);
      }

      const existing = await sessionRepository.lockUserSessionsInPhase(tx, phase.id);
      const existingIds = new Set(existing.map((row) => row.id));

      if (orderedIds.some((id) => !existingIds.has(id))) {
        throw new ValidationError('One or more session IDs do not belong to this phase');
      }

      if (orderedIds.length !== existing.length) {
        throw new ValidationError(
          `Expected ${String(existing.length)} session IDs but received ${String(orderedIds.length)}`
        );
      }

      const moved = existing.some(
        (session, index) => session.status !== 'not_started' && orderedIds[index] !== session.id
      );

      if (moved) {
        throw new ConflictError(
          'Only sessions that have not started yet can be moved; the others keep their place.'
        );
      }

      return await sessionRepository.reorderUserSessions(tx, phase.id, orderedIds);
    }
  );

  createLogger(ctx).info('Member sessions reordered', {
    action: 'member_sessions_reordered',
    publicId,
    organisationId: member.organisationId,
    programmePhaseId: phaseId,
  });

  return sessions.map((session) => memberSessionOrderResponseSchema.parse(session));
}
