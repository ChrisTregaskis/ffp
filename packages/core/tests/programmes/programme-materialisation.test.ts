import { readFileSync } from 'fs';
import { resolve } from 'path';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';

import {
  exerciseCompletions,
  programmePhases,
  programmes,
  sessionExercises,
  templatePhases,
  templateSessions,
  userSessionExercises,
  userSessions,
  type ExerciseCompletionRecord,
  type ProgrammePhaseRecord,
  type ProgrammeRecord,
  type UserSessionRecord,
} from '@ffp/database/schema';

import { closePool, withRLS } from '../../src/lib/database';
import { NotFoundError } from '../../src/lib/errors';
import { startSession } from '../../src/sessions/session.service';

import {
  createFixture,
  generateFor,
  memberContext,
  removeFixture,
  TEMPLATE_SHAPE,
  type Fixture,
} from './programme-fixture';

import type { Transaction } from '../../src/lib/database';

const BACKFILL_MIGRATION = resolve(
  __dirname,
  '../../../database/migrations/0030_amazing_roxanne_simpson.sql'
);

/** The migration's backfill statements, run as written. */
const backfillStatements = (): string[] =>
  readFileSync(BACKFILL_MIGRATION, 'utf8')
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.includes('INSERT INTO'));

interface ProgrammeState {
  programme: ProgrammeRecord;
  phases: ProgrammePhaseRecord[];
  sessions: UserSessionRecord[];
  completions: ExerciseCompletionRecord[];
}

interface MemberExercise {
  sourceSessionExerciseId: string | null;
  videoId: string;
  orderIndex: number;
  sets: number;
  reps: string;
  durationSeconds: number | null;
  restSeconds: number | null;
  notes: string | null;
}

interface MemberSession {
  templateSessionId: string;
  sessionNumber: number;
  status: string;
  exercises: MemberExercise[];
}

/** Every session and exercise the member layer holds for a programme, in order. */
async function readMemberLayer(tx: Transaction, programmeId: string): Promise<MemberSession[]> {
  const sessions = await tx
    .select({ session: userSessions })
    .from(userSessions)
    .innerJoin(programmePhases, eq(programmePhases.id, userSessions.programmePhaseId))
    .where(eq(programmePhases.programmeId, programmeId))
    .orderBy(asc(programmePhases.phaseNumber), asc(userSessions.sessionNumber));

  const exercises =
    sessions.length > 0
      ? await tx
          .select()
          .from(userSessionExercises)
          .where(
            inArray(
              userSessionExercises.userSessionId,
              sessions.map(({ session }) => session.id)
            )
          )
          .orderBy(asc(userSessionExercises.orderIndex))
      : [];

  return sessions.map(({ session }) => ({
    templateSessionId: session.templateSessionId,
    sessionNumber: session.sessionNumber,
    status: session.status,
    exercises: exercises
      .filter((exercise) => exercise.userSessionId === session.id)
      .map((exercise) => ({
        sourceSessionExerciseId: exercise.sourceSessionExerciseId,
        videoId: exercise.videoId,
        orderIndex: exercise.orderIndex,
        sets: exercise.sets,
        reps: exercise.reps,
        durationSeconds: exercise.durationSeconds,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
  }));
}

/** What the live template read resolves for the template, in the member layer's shape. */
async function readTemplateAsMemberLayer(
  tx: Transaction,
  templateId: string
): Promise<Omit<MemberSession, 'status'>[]> {
  const sessions = await tx
    .select({ session: templateSessions })
    .from(templateSessions)
    .innerJoin(templatePhases, eq(templatePhases.id, templateSessions.templatePhaseId))
    .where(eq(templatePhases.programmeTemplateId, templateId))
    .orderBy(asc(templatePhases.phaseNumber), asc(templateSessions.sessionNumber));

  const exercises = await tx
    .select()
    .from(sessionExercises)
    .where(
      inArray(
        sessionExercises.templateSessionId,
        sessions.map(({ session }) => session.id)
      )
    )
    .orderBy(asc(sessionExercises.orderIndex));

  return sessions.map(({ session }) => ({
    templateSessionId: session.id,
    sessionNumber: session.sessionNumber,
    exercises: exercises
      .filter((exercise) => exercise.templateSessionId === session.id)
      .map((exercise) => ({
        sourceSessionExerciseId: exercise.id,
        videoId: exercise.videoId,
        orderIndex: exercise.orderIndex,
        sets: exercise.sets,
        reps: exercise.reps,
        durationSeconds: exercise.durationSeconds,
        restSeconds: exercise.restSeconds,
        notes: exercise.notes,
      })),
  }));
}

const withoutStatus = (sessions: MemberSession[]): Omit<MemberSession, 'status'>[] =>
  sessions.map(({ status: _status, ...rest }) => rest);

describe('Programme materialisation', () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await createFixture();
  });

  afterEach(async () => {
    await removeFixture(fixture);
  });

  afterAll(async () => {
    await closePool();
  });

  const generate = (): Promise<string> => generateFor(fixture);

  it('writes a not_started session and its exercises for every template session', async () => {
    const programmeId = await generate();

    await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const memberLayer = await readMemberLayer(tx, programmeId);
      const template = await readTemplateAsMemberLayer(tx, fixture.templateId);

      expect(memberLayer).toHaveLength(3);
      expect(memberLayer.every((session) => session.status === 'not_started')).toBe(true);
      expect(withoutStatus(memberLayer)).toEqual(template);
    });
  });

  it('leaves an existing member’s rows unchanged when the template is edited afterwards', async () => {
    const programmeId = await generate();

    const before = await withRLS(fixture.organisationId, fixture.userId, (tx) =>
      readMemberLayer(tx, programmeId)
    );

    const [firstExercise, secondExercise] = before[0].exercises;
    const editedId = firstExercise.sourceSessionExerciseId ?? '';
    const deletedId = secondExercise.sourceSessionExerciseId ?? '';

    await withRLS(fixture.organisationId, undefined, async (tx) => {
      await tx
        .update(sessionExercises)
        .set({ sets: 9, reps: '99', notes: 'Edited after the programme was created' })
        .where(eq(sessionExercises.id, editedId));

      await tx.delete(sessionExercises).where(eq(sessionExercises.id, deletedId));

      await tx.insert(sessionExercises).values({
        templateSessionId: before[0].templateSessionId,
        videoId: fixture.videoIds[0],
        orderIndex: 5,
      });
    });

    const after = await withRLS(fixture.organisationId, fixture.userId, (tx) =>
      readMemberLayer(tx, programmeId)
    );

    // The deleted template exercise keeps the member's copy and only loses its provenance
    const expected = structuredClone(before);
    expected[0].exercises[1].sourceSessionExerciseId = null;

    expect(after).toEqual(expected);
  });

  it('backfills a pre-existing programme to the set the live template read resolves', async () => {
    // A programme as it stood before the member layer: phases, one started session, no exercises
    const programmeId = await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const [programme] = await tx
        .insert(programmes)
        .values({
          organisationId: fixture.organisationId,
          userId: fixture.userId,
          programmeTemplateId: fixture.templateId,
          name: 'Pre-existing programme',
          totalPhases: TEMPLATE_SHAPE.length,
        })
        .returning();

      const sourcePhases = await tx
        .select()
        .from(templatePhases)
        .where(eq(templatePhases.programmeTemplateId, fixture.templateId))
        .orderBy(asc(templatePhases.phaseNumber));

      const phases = await tx
        .insert(programmePhases)
        .values(
          sourcePhases.map((phase) => ({
            organisationId: fixture.organisationId,
            programmeId: programme.id,
            templatePhaseId: phase.id,
            phaseNumber: phase.phaseNumber,
            name: phase.name,
          }))
        )
        .returning();

      const [startedTemplateSession] = await tx
        .select()
        .from(templateSessions)
        .where(
          and(
            eq(templateSessions.templatePhaseId, sourcePhases[0].id),
            eq(templateSessions.sessionNumber, 1)
          )
        );

      await tx.insert(userSessions).values({
        organisationId: fixture.organisationId,
        programmePhaseId: phases[0].id,
        templateSessionId: startedTemplateSession.id,
        sessionNumber: 1,
        status: 'in_progress',
        startedAt: new Date(),
      });

      return programme.id;
    });

    const statements = backfillStatements();
    expect(statements).toHaveLength(2);

    await withRLS(fixture.organisationId, undefined, async (tx) => {
      for (const statement of statements) {
        await tx.execute(sql.raw(statement));
      }
    });

    await withRLS(fixture.organisationId, fixture.userId, async (tx) => {
      const memberLayer = await readMemberLayer(tx, programmeId);
      const template = await readTemplateAsMemberLayer(tx, fixture.templateId);

      expect(withoutStatus(memberLayer)).toEqual(template);
      expect(memberLayer.map((session) => session.status)).toEqual([
        'in_progress',
        'not_started',
        'not_started',
      ]);
    });
  });

  describe('startSession', () => {
    /** The generated programme's phases with their member sessions, in order. */
    const readProgramme = (programmeId: string): Promise<ProgrammeState> =>
      withRLS(fixture.organisationId, fixture.userId, async (tx) => {
        const [programme] = await tx
          .select()
          .from(programmes)
          .where(eq(programmes.id, programmeId));
        const phases = await tx
          .select()
          .from(programmePhases)
          .where(eq(programmePhases.programmeId, programmeId))
          .orderBy(asc(programmePhases.phaseNumber));
        const sessions = await tx
          .select()
          .from(userSessions)
          .where(
            inArray(
              userSessions.programmePhaseId,
              phases.map((phase) => phase.id)
            )
          )
          .orderBy(asc(userSessions.sessionNumber));
        const completions = await tx
          .select()
          .from(exerciseCompletions)
          .where(
            inArray(
              exerciseCompletions.userSessionId,
              sessions.map((session) => session.id)
            )
          );

        return { programme, phases, sessions, completions };
      });

    it('starts a not_started session: in_progress, completions created, phase and programme started', async () => {
      const programmeId = await generate();
      const { phases, sessions } = await readProgramme(programmeId);
      const target = sessions.find((session) => session.programmePhaseId === phases[0].id);

      const started = await startSession(
        { programmePhaseId: phases[0].id, templateSessionId: target?.templateSessionId ?? '' },
        memberContext(fixture)
      );

      const after = await readProgramme(programmeId);

      expect(started.id).toBe(target?.id);
      expect(started.status).toBe('in_progress');
      expect(started.startedAt).not.toBeNull();
      expect(started.exerciseCompletions).toHaveLength(2);
      expect(after.completions).toHaveLength(2);
      expect(after.phases[0].status).toBe('in_progress');
      expect(after.programme.startedAt).not.toBeNull();
    });

    it('resumes rather than restarts a session already started', async () => {
      const programmeId = await generate();
      const { phases, sessions } = await readProgramme(programmeId);
      const target = sessions.find((session) => session.programmePhaseId === phases[0].id);
      const input = {
        programmePhaseId: phases[0].id,
        templateSessionId: target?.templateSessionId ?? '',
      };

      const first = await startSession(input, memberContext(fixture));
      const second = await startSession(input, memberContext(fixture));
      const after = await readProgramme(programmeId);

      expect(second.id).toBe(first.id);
      expect(second.startedAt).toEqual(first.startedAt);
      expect(after.completions).toHaveLength(2);
    });

    it('refuses a session that belongs to another phase', async () => {
      const programmeId = await generate();
      const { phases, sessions } = await readProgramme(programmeId);
      const otherPhaseSession = sessions.find(
        (session) => session.programmePhaseId === phases[1].id
      );

      await expect(
        startSession(
          {
            programmePhaseId: phases[0].id,
            templateSessionId: otherPhaseSession?.templateSessionId ?? '',
          },
          memberContext(fixture)
        )
      ).rejects.toBeInstanceOf(NotFoundError);

      const after = await readProgramme(programmeId);

      expect(after.sessions.every((session) => session.status === 'not_started')).toBe(true);
      expect(after.completions).toHaveLength(0);
    });
  });
});
