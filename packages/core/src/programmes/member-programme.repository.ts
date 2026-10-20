import { and, asc, eq, inArray } from 'drizzle-orm';

import {
  exerciseCompletions,
  templatePhases,
  templateSessions,
  userSessionExercises,
  userSessions,
  videos,
  type ExerciseCompletionRecord,
  type TemplatePhaseRecord,
  type TemplateSessionRecord,
  type UserSessionExerciseRecord,
  type UserSessionRecord,
} from '@ffp/database/schema';

import { withRLS } from '../lib/database';

import type { ExerciseVideoSummary } from './programme.repository';

/** A member's exercise with embedded video metadata. */
export type MemberExerciseWithVideo = UserSessionExerciseRecord & { video: ExerciseVideoSummary };

/** A member's session with its exercises, completions and the template session's display fields. */
export interface MemberSessionDetail {
  session: UserSessionRecord;
  templateSession: Pick<
    TemplateSessionRecord,
    'id' | 'publicId' | 'name' | 'description' | 'estimatedDurationMinutes'
  >;
  exercises: MemberExerciseWithVideo[];
  completions: ExerciseCompletionRecord[];
}

/** A member's phase: the template phase's display fields and the member's sessions, in order. */
export interface MemberPhaseDetail {
  templatePhase: Pick<TemplatePhaseRecord, 'name' | 'description'> | null;
  sessions: MemberSessionDetail[];
}

/** Phase-level input for findMemberProgrammeStructure. */
export interface MemberPhaseRef {
  id: string;
  templatePhaseId: string;
}

/**
 * Fetch a member's sessions, exercises and completions for the given programme phases,
 * keyed by programme phase ID. RLS-scoped; the template is read only for display text.
 */
export async function findMemberProgrammeStructure(
  organisationId: string,
  userId: string,
  phases: MemberPhaseRef[]
): Promise<Map<string, MemberPhaseDetail>> {
  if (phases.length === 0) {
    return new Map();
  }

  return await withRLS(organisationId, userId, async (tx) => {
    const templatePhaseRows = await tx
      .select({
        id: templatePhases.id,
        name: templatePhases.name,
        description: templatePhases.description,
      })
      .from(templatePhases)
      .where(
        inArray(
          templatePhases.id,
          phases.map((phase) => phase.templatePhaseId)
        )
      );

    const sessionRows = await tx
      .select({
        session: userSessions,
        templateSession: {
          id: templateSessions.id,
          publicId: templateSessions.publicId,
          name: templateSessions.name,
          description: templateSessions.description,
          estimatedDurationMinutes: templateSessions.estimatedDurationMinutes,
        },
      })
      .from(userSessions)
      .innerJoin(templateSessions, eq(templateSessions.id, userSessions.templateSessionId))
      .where(
        and(
          eq(userSessions.organisationId, organisationId),
          inArray(
            userSessions.programmePhaseId,
            phases.map((phase) => phase.id)
          )
        )
      )
      .orderBy(asc(userSessions.programmePhaseId), asc(userSessions.sessionNumber));

    const sessionIds = sessionRows.map((row) => row.session.id);

    const exerciseRows =
      sessionIds.length > 0
        ? await tx
            .select({
              exercise: userSessionExercises,
              video: {
                id: videos.id,
                title: videos.title,
                durationSeconds: videos.durationSeconds,
                difficulty: videos.difficulty,
              },
            })
            .from(userSessionExercises)
            .innerJoin(videos, eq(userSessionExercises.videoId, videos.id))
            .where(
              and(
                eq(userSessionExercises.organisationId, organisationId),
                inArray(userSessionExercises.userSessionId, sessionIds)
              )
            )
            .orderBy(asc(userSessionExercises.userSessionId), asc(userSessionExercises.orderIndex))
        : [];

    const completionRows =
      sessionIds.length > 0
        ? await tx
            .select()
            .from(exerciseCompletions)
            .where(
              and(
                eq(exerciseCompletions.organisationId, organisationId),
                inArray(exerciseCompletions.userSessionId, sessionIds)
              )
            )
        : [];

    const exercisesBySession = groupBy(
      exerciseRows.map((row) => ({ ...row.exercise, video: row.video })),
      (exercise) => exercise.userSessionId
    );
    const completionsBySession = groupBy(completionRows, (completion) => completion.userSessionId);
    const sessionsByPhase = groupBy(
      sessionRows.map(
        (row): MemberSessionDetail => ({
          session: row.session,
          templateSession: row.templateSession,
          exercises: exercisesBySession.get(row.session.id) ?? [],
          completions: completionsBySession.get(row.session.id) ?? [],
        })
      ),
      (detail) => detail.session.programmePhaseId
    );
    const templatePhaseById = new Map(templatePhaseRows.map((row) => [row.id, row]));

    return new Map(
      phases.map((phase) => [
        phase.id,
        {
          templatePhase: templatePhaseById.get(phase.templatePhaseId) ?? null,
          sessions: sessionsByPhase.get(phase.id) ?? [],
        },
      ])
    );
  });
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = keyOf(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return groups;
}
